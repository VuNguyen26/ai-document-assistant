import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, Prisma } from '@prisma/client';
import { extname, basename } from 'path';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { ChunksService } from '../chunks/chunks.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ExtractionService } from '../extraction/extraction.service';
import type { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import type { UploadedFile } from './interfaces/uploaded-file.interface';

const DOCUMENT_SELECT = {
  id: true,
  userId: true,
  title: true,
  originalFilename: true,
  storageKey: true,
  mimeType: true,
  fileSize: true,
  sourceLanguage: true,
  pageCount: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

const INCOMPLETE_STATUSES: DocumentStatus[] = [
  DocumentStatus.UPLOADED,
  DocumentStatus.PROCESSING,
  DocumentStatus.EXTRACTED,
  DocumentStatus.CHUNKED,
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService,
    private readonly chunksService: ChunksService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async upload(userId: string, dto: UploadDocumentDto, file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('File là bắt buộc');
    }

    this.validateFile(file);

    const title = this.resolveTitle(dto.title, file.originalname);
    const storageKey = `documents/${file.filename}`;

    const document = await this.prisma.document.create({
      data: {
        userId,
        title,
        originalFilename: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        status: DocumentStatus.UPLOADED,
        errorMessage: null,
      },
      select: DOCUMENT_SELECT,
    });

    return this.serializeDocument(document);
  }

  async findAll(userId: string, query: ListDocumentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const baseWhere: Prisma.DocumentWhereInput = {
      userId,
      deletedAt: null,
    };

    const filteredWhere: Prisma.DocumentWhereInput = {
      ...baseWhere,
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                originalFilename: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.DocumentOrderByWithRelationInput;

    const [documents, filteredTotal, totalAll, readyCount, failedCount, incompleteCount] =
      await Promise.all([
        this.prisma.document.findMany({
          where: filteredWhere,
          orderBy,
          skip,
          take: limit,
          select: DOCUMENT_SELECT,
        }),
        this.prisma.document.count({
          where: filteredWhere,
        }),
        this.prisma.document.count({
          where: baseWhere,
        }),
        this.prisma.document.count({
          where: {
            ...baseWhere,
            status: DocumentStatus.READY,
          },
        }),
        this.prisma.document.count({
          where: {
            ...baseWhere,
            status: DocumentStatus.FAILED,
          },
        }),
        this.prisma.document.count({
          where: {
            ...baseWhere,
            status: {
              in: INCOMPLETE_STATUSES,
            },
          },
        }),
      ]);

    return {
      items: documents.map((document) => this.serializeDocument(document)),
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: filteredTotal === 0 ? 1 : Math.ceil(filteredTotal / limit),
      },
      summary: {
        total: totalAll,
        ready: readyCount,
        failed: failedCount,
        incomplete: incompleteCount,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const document = await this.findOwnedDocumentOrThrow(userId, id);
    return this.serializeDocument(document);
  }

  async softDelete(userId: string, id: string) {
    await this.findOwnedDocumentOrThrow(userId, id);

    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Xóa tài liệu thành công',
    };
  }

  async processDocument(userId: string, id: string) {
    let pipelineState = await this.getPipelineState(userId, id);

    if (pipelineState.status === DocumentStatus.PROCESSING) {
      throw new BadRequestException('Tài liệu đang được xử lý. Vui lòng thử lại sau.');
    }

    if (
      pipelineState.status === DocumentStatus.READY &&
      pipelineState.embeddingCount > 0
    ) {
      const document = await this.findOwnedDocumentOrThrow(userId, id);

      return {
        message: 'Tài liệu đã sẵn sàng để chat.',
        data: {
          document: this.serializeDocument(document),
          stepsRun: [] as string[],
          completed: true,
          reprocessed: false,
        },
      };
    }

    const stepsRun: string[] = [];

    if (
      !pipelineState.hasContent ||
      pipelineState.status === DocumentStatus.UPLOADED ||
      pipelineState.status === DocumentStatus.FAILED
    ) {
      await this.extractionService.extractDocument(id, userId);
      stepsRun.push('extract');
      pipelineState = await this.getPipelineState(userId, id);
    }

    if (pipelineState.chunkCount === 0) {
      await this.chunksService.chunkDocument(id, userId);
      stepsRun.push('chunk');
      pipelineState = await this.getPipelineState(userId, id);
    }

    if (pipelineState.embeddingCount === 0) {
      await this.embeddingsService.embedDocument(id, userId);
      stepsRun.push('embed');
      pipelineState = await this.getPipelineState(userId, id);
    }

    const document = await this.findOwnedDocumentOrThrow(userId, id);

    return {
      message: 'Xử lý tài liệu hoàn tất.',
      data: {
        document: this.serializeDocument(document),
        stepsRun,
        completed: document.status === DocumentStatus.READY,
        reprocessed: false,
      },
    };
  }

  async reprocessDocument(userId: string, id: string) {
    const pipelineState = await this.getPipelineState(userId, id);

    if (pipelineState.status === DocumentStatus.PROCESSING) {
      throw new BadRequestException('Tài liệu đang được xử lý. Vui lòng thử lại sau.');
    }

    await this.resetPipelineData(id);

    const result = await this.processDocument(userId, id);
    const refreshedDocument = await this.findOwnedDocumentOrThrow(userId, id);

    return {
      message: 'Đã reprocess tài liệu từ đầu.',
      data: {
        ...result.data,
        document: this.serializeDocument(refreshedDocument),
        reprocessed: true,
      },
    };
  }

  private async resetPipelineData(documentId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.documentChunkEmbedding.deleteMany({
        where: {
          chunk: {
            documentId,
          },
        },
      });

      await tx.documentChunk.deleteMany({
        where: {
          documentId,
        },
      });

      await tx.documentContent.deleteMany({
        where: {
          documentId,
        },
      });

      await tx.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: DocumentStatus.UPLOADED,
          sourceLanguage: null,
          pageCount: null,
          errorMessage: null,
        },
      });
    });
  }

  private async findOwnedDocumentOrThrow(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: DOCUMENT_SELECT,
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    return document;
  }

  private async getPipelineState(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        ...DOCUMENT_SELECT,
        content: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    const embeddingCount = await this.prisma.documentChunkEmbedding.count({
      where: {
        chunk: {
          documentId: id,
        },
      },
    });

    return {
      document,
      status: document.status,
      hasContent: Boolean(document.content),
      chunkCount: document._count.chunks,
      embeddingCount,
    };
  }

  private validateFile(file: UploadedFile) {
    const extension = extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    const isAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
    const isAllowedMimeType = ALLOWED_MIME_TYPES.has(mimeType);

    if (!isAllowedExtension || !isAllowedMimeType) {
      throw new BadRequestException('Chỉ hỗ trợ file PDF, DOCX hoặc TXT');
    }
  }

  private resolveTitle(title: string | undefined, originalFilename: string) {
    if (title?.trim()) {
      return title.trim();
    }

    const extension = extname(originalFilename);
    return basename(originalFilename, extension).trim() || 'Untitled Document';
  }

  private serializeDocument(document: {
    id: string;
    userId: string;
    title: string;
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSize: bigint;
    sourceLanguage: string | null;
    pageCount: number | null;
    status: DocumentStatus;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      ...document,
      fileSize: document.fileSize.toString(),
    };
  }
}