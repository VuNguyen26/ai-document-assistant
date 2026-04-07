import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { chunkText } from './utils/text-chunker';

@Injectable()
export class ChunksService {
  constructor(private readonly prisma: PrismaService) {}

  async chunkDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const contentRecord = await this.prisma.documentContent.findUnique({
      where: {
        documentId,
      },
      select: {
        id: true,
        cleanedText: true,
        textLength: true,
      },
    });

    if (!contentRecord) {
      throw new BadRequestException(
        'Document content not found. Please extract the document first.',
      );
    }

    if (!contentRecord.cleanedText?.trim()) {
      throw new BadRequestException('Document cleaned text is empty');
    }

    const chunkSize = 1200;
    const chunkOverlap = 200;

    const chunks = chunkText(contentRecord.cleanedText, {
      chunkSize,
      chunkOverlap,
    });

    if (chunks.length === 0) {
      throw new BadRequestException(
        'No chunks were generated from this document',
      );
    }

    await this.prisma.$transaction([
      this.prisma.documentChunk.deleteMany({
        where: {
          documentId,
        },
      }),
      this.prisma.documentChunk.createMany({
        data: chunks.map((chunk) => ({
          documentId,
          documentContentId: contentRecord.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          charCount: chunk.charCount,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        })),
      }),
    ]);

    return {
      message: 'Document chunked successfully',
      data: {
        documentId,
        chunkCount: chunks.length,
        chunkSize,
        chunkOverlap,
        overwritten: true,
      },
    };
  }

  async listChunks(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        documentId,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
    });

    return {
      message: 'Document chunks fetched successfully',
      data: chunks,
    };
  }
}