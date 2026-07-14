import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { SemanticSearchDto } from './dto/semantic-search.dto';
import { SemanticSearchResult } from './interfaces/semantic-search-result.interface';

type RawSearchRow = {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number | null;
  endOffset: number | null;
  distance: number;
};

@Injectable()
export class SearchService {
  private readonly openai: OpenAI;
  private readonly embeddingModel = 'openai/text-embedding-3-small';
  private readonly embeddingDimensions = 1536;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing in environment variables');
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async semanticSearch(
    userId: string,
    dto: SemanticSearchDto,
  ): Promise<{
    query: string;
    documentId?: string;
    workspaceId?: string;
    topK: number;
    results: SemanticSearchResult[];
  }> {
    const query = dto.query.trim();

    if (!query) {
      throw new BadRequestException('Query must not be empty');
    }

    if (dto.documentId && dto.workspaceId) {
      throw new BadRequestException(
        'documentId và workspaceId không được truyền cùng lúc',
      );
    }

    const topK = dto.topK ?? 5;

    if (dto.documentId) {
      await this.ensureReadyDocumentOwnership(dto.documentId, userId);
    }

    if (dto.workspaceId) {
      await this.ensureWorkspaceOwnership(dto.workspaceId, userId);
    }

    const queryEmbedding = await this.createQueryEmbedding(query);

    if (queryEmbedding.length !== this.embeddingDimensions) {
      throw new InternalServerErrorException(
        `Embedding dimension mismatch. Expected ${this.embeddingDimensions}, got ${queryEmbedding.length}`,
      );
    }

    const vectorLiteral = this.toVectorLiteral(queryEmbedding);

    const rows = await this.runSimilaritySearch(
      userId,
      vectorLiteral,
      topK,
      dto.documentId,
      dto.workspaceId,
    );

    const results: SemanticSearchResult[] = rows.map((row) => {
      const safeDistance = Number(row.distance);
      const score = Number((1 - safeDistance).toFixed(6));

      return {
        chunkId: row.chunkId,
        documentId: row.documentId,
        documentName: row.documentName,
        chunkIndex: row.chunkIndex,
        content: row.content,
        charCount: row.charCount,
        startOffset: row.startOffset,
        endOffset: row.endOffset,
        distance: Number(safeDistance.toFixed(6)),
        score,
      };
    });

    return {
      query,
      documentId: dto.documentId,
      workspaceId: dto.workspaceId,
      topK,
      results,
    };
  }

  private async ensureReadyDocumentOwnership(
    documentId: string,
    userId: string,
  ): Promise<void> {
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

    if (document.status !== 'READY') {
      throw new BadRequestException(
        'Document is not ready for semantic search. Please extract, chunk, and embed it first.',
      );
    }
  }

  private async ensureWorkspaceOwnership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }

  private async createQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: query,
        dimensions: this.embeddingDimensions,
      });

      const embedding = response.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new InternalServerErrorException(
          'Failed to generate query embedding',
        );
      }

      return embedding;
    } catch (error) {
      console.error('Failed to create query embedding:', error);
      throw new InternalServerErrorException(
        'Failed to generate query embedding from OpenRouter',
      );
    }
  }

  private toVectorLiteral(values: number[]): string {
    return `[${values.join(',')}]`;
  }

  private async runSimilaritySearch(
    userId: string,
    vectorLiteral: string,
    topK: number,
    documentId?: string,
    workspaceId?: string,
  ): Promise<RawSearchRow[]> {
    try {
      if (documentId) {
        const rows = await this.prisma.$queryRaw<RawSearchRow[]>`
          SELECT
            dc.id AS "chunkId",
            d.id AS "documentId",
            d.original_filename AS "documentName",
            dc.chunk_index AS "chunkIndex",
            dc.content AS "content",
            dc.char_count AS "charCount",
            dc.start_offset AS "startOffset",
            dc.end_offset AS "endOffset",
            (dce.embedding <=> ${vectorLiteral}::vector) AS "distance"
          FROM document_chunk_embeddings dce
          INNER JOIN document_chunks dc
            ON dc.id = dce.chunk_id
          INNER JOIN documents d
            ON d.id = dc.document_id
          WHERE d.user_id = ${userId}
            AND d.deleted_at IS NULL
            AND d.status = 'READY'
            AND d.id = ${documentId}
          ORDER BY dce.embedding <=> ${vectorLiteral}::vector ASC
          LIMIT ${topK};
        `;

        return rows;
      }

      if (workspaceId) {
        const rows = await this.prisma.$queryRaw<RawSearchRow[]>`
          SELECT
            dc.id AS "chunkId",
            d.id AS "documentId",
            d.original_filename AS "documentName",
            dc.chunk_index AS "chunkIndex",
            dc.content AS "content",
            dc.char_count AS "charCount",
            dc.start_offset AS "startOffset",
            dc.end_offset AS "endOffset",
            (dce.embedding <=> ${vectorLiteral}::vector) AS "distance"
          FROM workspace_documents wd
          INNER JOIN documents d
            ON d.id = wd.document_id
          INNER JOIN document_chunks dc
            ON dc.document_id = d.id
          INNER JOIN document_chunk_embeddings dce
            ON dce.chunk_id = dc.id
          WHERE wd.workspace_id = ${workspaceId}
            AND d.user_id = ${userId}
            AND d.deleted_at IS NULL
            AND d.status = 'READY'
          ORDER BY dce.embedding <=> ${vectorLiteral}::vector ASC
          LIMIT ${topK};
        `;

        return rows;
      }

      const rows = await this.prisma.$queryRaw<RawSearchRow[]>`
        SELECT
          dc.id AS "chunkId",
          d.id AS "documentId",
          d.original_filename AS "documentName",
          dc.chunk_index AS "chunkIndex",
          dc.content AS "content",
          dc.char_count AS "charCount",
          dc.start_offset AS "startOffset",
          dc.end_offset AS "endOffset",
          (dce.embedding <=> ${vectorLiteral}::vector) AS "distance"
        FROM document_chunk_embeddings dce
        INNER JOIN document_chunks dc
          ON dc.id = dce.chunk_id
        INNER JOIN documents d
          ON d.id = dc.document_id
        WHERE d.user_id = ${userId}
          AND d.deleted_at IS NULL
          AND d.status = 'READY'
        ORDER BY dce.embedding <=> ${vectorLiteral}::vector ASC
        LIMIT ${topK};
      `;

      return rows;
    } catch (error) {
      console.error('Failed to run semantic search:', error);
      throw new InternalServerErrorException('Failed to run semantic search');
    }
  }
}
