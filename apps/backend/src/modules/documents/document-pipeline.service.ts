import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { ChunksService } from '../chunks/chunks.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ExtractionService } from '../extraction/extraction.service';

@Injectable()
export class DocumentPipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService,
    private readonly chunksService: ChunksService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async processDocument(userId: string, id: string) {
    let pipelineState = await this.getPipelineState(userId, id);

    if (pipelineState.status === DocumentStatus.PROCESSING) {
      throw new BadRequestException(
        'Tài liệu đang được xử lý. Vui lòng thử lại sau.',
      );
    }

    if (
      pipelineState.status === DocumentStatus.READY &&
      pipelineState.embeddingCount > 0
    ) {
      const document = await this.findOwnedDocumentOrThrow(userId, id);

      return {
        document: this.serializeDocument(document),
        stepsRun: [] as string[],
        completed: true,
        reprocessed: false,
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
      document: this.serializeDocument(document),
      stepsRun,
      completed: document.status === DocumentStatus.READY,
      reprocessed: false,
    };
  }

  async reprocessDocument(userId: string, id: string) {
    const pipelineState = await this.getPipelineState(userId, id);

    if (pipelineState.status === DocumentStatus.PROCESSING) {
      throw new BadRequestException(
        'Tài liệu đang được xử lý. Vui lòng thử lại sau.',
      );
    }

    await this.resetPipelineData(id);

    const result = await this.processDocument(userId, id);
    const refreshedDocument = await this.findOwnedDocumentOrThrow(userId, id);

    return {
      ...result,
      document: this.serializeDocument(refreshedDocument),
      reprocessed: true,
    };
  }

  async markDocumentQueued(documentId: string) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.PROCESSING,
        errorMessage: null,
      },
    });
  }

  async markDocumentFailed(documentId: string, errorMessage?: string) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.FAILED,
        errorMessage: errorMessage ?? 'Unknown pipeline error',
      },
    });
  }

  async findOwnedDocumentOrThrow(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
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
      },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    return document;
  }

  async resetPipelineData(documentId: string) {
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

  private async getPipelineState(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
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
