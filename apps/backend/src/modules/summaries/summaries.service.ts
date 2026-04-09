import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SummaryType } from '@prisma/client';
import OpenAI from 'openai';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { ListSummariesQueryDto } from './dto/list-summaries-query.dto';

const MAX_SOURCE_CHARS = 18000;

@Injectable()
export class SummariesService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing in environment variables');
    }

    this.chatModel =
      this.configService.get<string>('OPENROUTER_CHAT_MODEL') ||
      'openai/gpt-4o-mini';

    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async createSummary(userId: string, dto: CreateSummaryDto) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: dto.documentId,
        userId,
        deletedAt: null,
      },
      include: {
        content: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const sourceText =
      document.content?.cleanedText ||
      document.content?.extractedText ||
      '';

    if (!sourceText.trim()) {
      throw new BadRequestException(
        'Document chưa có extracted content. Hãy chạy Extract hoặc Process document trước.',
      );
    }

    const language = dto.language?.trim() || document.sourceLanguage || 'vi';
    const promptStyle = dto.promptStyle?.trim() || null;
    const clippedSource = sourceText.slice(0, MAX_SOURCE_CHARS);

    const content = await this.generateSummary({
      sourceText: clippedSource,
      language,
      summaryType: dto.summaryType,
      promptStyle,
    });

    const created = await this.prisma.summary.create({
      data: {
        documentId: document.id,
        language,
        summaryType: dto.summaryType,
        promptStyle,
        content,
        createdByAiModel: this.chatModel,
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            originalFilename: true,
          },
        },
      },
    });

    return this.serializeSummary(created);
  }

  async listSummaries(userId: string, query: ListSummariesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SummaryWhereInput = {
      document: {
        userId,
        deletedAt: null,
      },
      ...(query.documentId
        ? {
            documentId: query.documentId,
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.summary.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalFilename: true,
            },
          },
        },
      }),
      this.prisma.summary.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeSummary(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
      },
    };
  }

  async deleteSummary(userId: string, summaryId: string) {
    const summary = await this.prisma.summary.findUnique({
      where: {
        id: summaryId,
      },
      include: {
        document: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    if (summary.document.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this summary',
      );
    }

    await this.prisma.summary.delete({
      where: {
        id: summaryId,
      },
    });

    return {
      id: summaryId,
    };
  }

  private async generateSummary(params: {
    sourceText: string;
    language: string;
    summaryType: SummaryType;
    promptStyle: string | null;
  }): Promise<string> {
    const { sourceText, language, summaryType, promptStyle } = params;

    const styleInstruction = this.getSummaryTypeInstruction(summaryType);
    const promptStyleInstruction = promptStyle
      ? `Phong cách trình bày mong muốn: ${promptStyle}.`
      : 'Phong cách trình bày: rõ ràng, dễ hiểu, thực dụng.';

    try {
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: [
              'You are an expert document summarization assistant.',
              'Summarize only from the provided document content.',
              'Do not invent information.',
              `Return the summary in language: ${language}.`,
            ].join(' '),
          },
          {
            role: 'user',
            content: `Hãy tóm tắt tài liệu dưới đây.

Loại summary: ${summaryType}
Yêu cầu chi tiết: ${styleInstruction}
${promptStyleInstruction}

Nội dung tài liệu:
${sourceText}`,
          },
        ],
      });

      const summary = response.choices?.[0]?.message?.content?.trim();

      if (!summary) {
        throw new InternalServerErrorException('LLM returned empty summary');
      }

      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      throw new InternalServerErrorException(
        'Failed to generate summary from document content',
      );
    }
  }

  private getSummaryTypeInstruction(summaryType: SummaryType): string {
    switch (summaryType) {
      case 'SHORT':
        return 'Viết bản tóm tắt ngắn gọn, súc tích, khoảng 1-2 đoạn.';
      case 'DETAILED':
        return 'Viết bản tóm tắt chi tiết, có cấu trúc rõ ràng, nêu đầy đủ các ý chính.';
      case 'BULLET':
        return 'Tóm tắt dưới dạng bullet points, dễ quét nhanh.';
      case 'BEGINNER':
        return 'Giải thích theo cách rất dễ hiểu cho người mới.';
      case 'PRESENTATION':
        return 'Tóm tắt theo kiểu có thể dùng để làm slide/presentation.';
      default:
        return 'Tóm tắt rõ ràng, chính xác.';
    }
  }

  private serializeSummary(item: {
    id: string;
    documentId: string;
    language: string;
    summaryType: SummaryType;
    promptStyle: string | null;
    content: string;
    createdByAiModel: string;
    createdAt: Date;
    document: {
      id: string;
      title: string;
      originalFilename: string;
    };
  }) {
    return {
      id: item.id,
      documentId: item.documentId,
      documentTitle: item.document.title,
      documentOriginalFilename: item.document.originalFilename,
      language: item.language,
      summaryType: item.summaryType,
      promptStyle: item.promptStyle,
      content: item.content,
      createdByAiModel: item.createdByAiModel,
      createdAt: item.createdAt,
    };
  }
}