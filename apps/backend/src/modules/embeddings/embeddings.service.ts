import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';

import { PrismaService } from '../../libs/prisma/prisma.service';

@Injectable()
export class EmbeddingsService {
  private readonly client: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing in .env');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'AI Document Assistant',
      },
    });
  }

  async embedDocument(documentId: string, userId: string) {
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
      select: {
        id: true,
        chunkIndex: true,
        content: true,
      },
    });

    if (chunks.length === 0) {
      throw new BadRequestException(
        'No chunks found for this document. Please chunk the document first.',
      );
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.PROCESSING,
        errorMessage: null,
      },
    });

    try {
      for (const chunk of chunks) {
        const response = await this.client.embeddings.create({
          model: 'openai/text-embedding-3-small',
          input: chunk.content,
          dimensions: 1536,
        });

        const embedding = response.data[0]?.embedding;

        if (!embedding || embedding.length === 0) {
          throw new Error(
            `Empty embedding returned for chunk ${chunk.chunkIndex}`,
          );
        }

        const vectorLiteral = `[${embedding.join(',')}]`;

        await this.prisma.$executeRawUnsafe(
          `
          INSERT INTO document_chunk_embeddings
            (id, chunk_id, model, dimensions, embedding, created_at, updated_at)
          VALUES
            ($1, $2, $3, $4, $5::vector, NOW(), NOW())
          ON CONFLICT (chunk_id)
          DO UPDATE SET
            model = EXCLUDED.model,
            dimensions = EXCLUDED.dimensions,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
          `,
          randomUUID(),
          chunk.id,
          'openai/text-embedding-3-small',
          embedding.length,
          vectorLiteral,
        );
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.READY,
          errorMessage: null,
        },
      });

      return {
        message: 'Embeddings created successfully',
        data: {
          documentId,
          status: DocumentStatus.READY,
          chunkCount: chunks.length,
        },
      };
    } catch (error) {
      console.error('embedDocument error:', error);

      const message =
        error instanceof Error ? error.message : 'Unknown embedding error';

      await this.markDocumentFailed(documentId, message);

      throw new InternalServerErrorException(
        `Failed to create embeddings: ${message}`,
      );
    }
  }

  private async markDocumentFailed(
    documentId: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: DocumentStatus.FAILED,
        errorMessage: errorMessage ?? 'Unknown embedding error',
      },
    });
  }
}
