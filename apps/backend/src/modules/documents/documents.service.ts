import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, Prisma } from '@prisma/client';
import { basename, extname } from 'path';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { DocumentPipelineService } from './document-pipeline.service';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
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

type LatestJob = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  nextRunAt: Date;
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentPipelineService: DocumentPipelineService,
    private readonly documentProcessingJobsService: DocumentProcessingJobsService,
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

    const job = await this.documentProcessingJobsService.enqueueProcessJob(
      userId,
      document.id,
    );

    return {
      message: 'Tải tài liệu thành công và đã đưa vào hàng đợi xử lý.',
      data: {
        document: this.serializeDocument(document, job),
        autoQueued: true,
        job,
      },
    };
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

    const [
      documents,
      filteredTotal,
      totalAll,
      readyCount,
      failedCount,
      incompleteCount,
    ] = await Promise.all([
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

    const latestJobs = await this.findLatestJobsForDocuments(
      userId,
      documents.map((document) => document.id),
    );

    return {
      items: documents.map((document) =>
        this.serializeDocument(document, latestJobs.get(document.id) ?? null),
      ),
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
    const latestJob =
      await this.documentProcessingJobsService.getLatestJobForDocument(
        userId,
        id,
      );

    return this.serializeDocument(document, latestJob);
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
    await this.findOwnedDocumentOrThrow(userId, id);

    const job = await this.documentProcessingJobsService.enqueueProcessJob(
      userId,
      id,
    );

    const document = await this.findOwnedDocumentOrThrow(userId, id);

    return {
      message: 'Đã đưa tài liệu vào hàng đợi xử lý.',
      data: {
        document: this.serializeDocument(document, job),
        job,
        stepsRun: [] as string[],
        completed: false,
        reprocessed: false,
        queued: true,
      },
    };
  }

  async reprocessDocument(userId: string, id: string) {
    await this.findOwnedDocumentOrThrow(userId, id);

    const job = await this.documentProcessingJobsService.enqueueReprocessJob(
      userId,
      id,
    );

    const document = await this.findOwnedDocumentOrThrow(userId, id);

    return {
      message: 'Đã đưa tài liệu vào hàng đợi reprocess.',
      data: {
        document: this.serializeDocument(document, job),
        job,
        stepsRun: [] as string[],
        completed: false,
        reprocessed: true,
        queued: true,
      },
    };
  }

  async listDocumentJobs(
    userId: string,
    documentId: string,
    page: number,
    limit: number,
  ) {
    return this.documentProcessingJobsService.listJobsForDocument(
      userId,
      documentId,
      page,
      limit,
    );
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

  private async findLatestJobsForDocuments(
    userId: string,
    documentIds: string[],
  ) {
    if (documentIds.length === 0) {
      return new Map<string, LatestJob>();
    }

    const jobs = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        userId: string;
        documentId: string;
        type: string;
        status: string;
        attempts: number;
        maxAttempts: number;
        errorMessage: string | null;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date | null;
        nextRunAt: Date;
      }>
    >(
      `
        SELECT
          id,
          user_id AS "userId",
          document_id AS "documentId",
          type,
          status,
          attempts,
          max_attempts AS "maxAttempts",
          error_message AS "errorMessage",
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          completed_at AS "completedAt",
          next_run_at AS "nextRunAt"
        FROM document_processing_jobs
        WHERE user_id = $1
          AND document_id = ANY($2::text[])
        ORDER BY document_id ASC, created_at DESC
      `,
      userId,
      documentIds,
    );

    const latestJobMap = new Map<string, LatestJob>();

    for (const job of jobs) {
      if (!latestJobMap.has(job.documentId)) {
        latestJobMap.set(job.documentId, job);
      }
    }

    return latestJobMap;
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

  private serializeDocument(
    document: {
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
    },
    latestJob?: LatestJob | null,
  ) {
    return {
      ...document,
      fileSize: document.fileSize.toString(),
      latestJob: latestJob
        ? {
            id: latestJob.id,
            type: latestJob.type,
            status: latestJob.status,
            attempts: latestJob.attempts,
            maxAttempts: latestJob.maxAttempts,
            errorMessage: latestJob.errorMessage,
            createdAt: latestJob.createdAt,
            updatedAt: latestJob.updatedAt,
            completedAt: latestJob.completedAt,
            nextRunAt: latestJob.nextRunAt,
          }
        : null,
    };
  }
}
