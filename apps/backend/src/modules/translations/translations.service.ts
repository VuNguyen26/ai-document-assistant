import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { ListTranslationsQueryDto } from './dto/list-translations-query.dto';

const MAX_SOURCE_CHARS = 18000;

type TranslationWithDocument = Prisma.TranslationGetPayload<{
  include: {
    document: {
      select: {
        id: true;
        title: true;
        originalFilename: true;
      };
    };
  };
}>;

type SummaryLookup = {
  id: string;
  summaryType: string;
  language: string;
};

@Injectable()
export class TranslationsService {
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

  async createTranslation(userId: string, dto: CreateTranslationDto) {
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

    const sourceType = dto.sourceType;
    const targetLanguage = dto.targetLanguage.trim();
    const style = dto.style?.trim() || null;

    let sourceId: string | null = dto.sourceId?.trim() || null;
    let sourceText = '';
    let sourceLanguage = dto.sourceLanguage?.trim() || '';
    let summaryLookup: SummaryLookup | null = null;

    if (sourceType === 'DOCUMENT') {
      sourceText =
        document.content?.cleanedText ||
        document.content?.extractedText ||
        '';
      sourceLanguage = sourceLanguage || document.sourceLanguage || 'auto';
    } else {
      if (!sourceId) {
        throw new BadRequestException(
          'sourceId là bắt buộc khi sourceType = SUMMARY',
        );
      }

      const summary = await this.prisma.summary.findFirst({
        where: {
          id: sourceId,
          documentId: document.id,
          document: {
            userId,
            deletedAt: null,
          },
        },
      });

      if (!summary) {
        throw new NotFoundException('Summary not found');
      }

      sourceText = summary.content;
      sourceLanguage =
        sourceLanguage || summary.language || document.sourceLanguage || 'auto';

      summaryLookup = {
        id: summary.id,
        summaryType: summary.summaryType,
        language: summary.language,
      };
    }

    if (!sourceText.trim()) {
      throw new BadRequestException(
        sourceType === 'DOCUMENT'
          ? 'Document chưa có extracted content. Hãy chạy Extract hoặc Process document trước.'
          : 'Summary hiện không có nội dung để dịch.',
      );
    }

    const translatedContent = await this.generateTranslation({
      sourceText: sourceText.slice(0, MAX_SOURCE_CHARS),
      sourceLanguage,
      targetLanguage,
      style,
    });

    const created = await this.prisma.translation.create({
      data: {
        documentId: document.id,
        sourceType,
        sourceId,
        sourceLanguage,
        targetLanguage,
        style,
        content: translatedContent,
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

    return this.serializeTranslation(created, summaryLookup);
  }

  async listTranslations(userId: string, query: ListTranslationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TranslationWhereInput = {
      document: {
        userId,
        deletedAt: null,
      },
      ...(query.documentId
        ? {
            documentId: query.documentId,
          }
        : {}),
      ...(query.sourceType
        ? {
            sourceType: query.sourceType,
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.translation.findMany({
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
      this.prisma.translation.count({ where }),
    ]);

    const summaryIds = Array.from(
      new Set(
        items
          .filter((item) => item.sourceType === 'SUMMARY' && item.sourceId)
          .map((item) => item.sourceId as string),
      ),
    );

    const summaries = summaryIds.length
      ? await this.prisma.summary.findMany({
          where: {
            id: {
              in: summaryIds,
            },
            document: {
              userId,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            summaryType: true,
            language: true,
          },
        })
      : [];

    const summaryMap = new Map(
      summaries.map((summary) => [
        summary.id,
        {
          id: summary.id,
          summaryType: summary.summaryType,
          language: summary.language,
        },
      ]),
    );

    return {
      items: items.map((item) =>
        this.serializeTranslation(
          item,
          item.sourceId ? summaryMap.get(item.sourceId) ?? null : null,
        ),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
      },
    };
  }

  async deleteTranslation(userId: string, translationId: string) {
    const translation = await this.prisma.translation.findUnique({
      where: {
        id: translationId,
      },
      include: {
        document: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    if (translation.document.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this translation',
      );
    }

    await this.prisma.translation.delete({
      where: {
        id: translationId,
      },
    });

    return {
      id: translationId,
    };
  }

  private async generateTranslation(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    style: string | null;
  }): Promise<string> {
    const { sourceText, sourceLanguage, targetLanguage, style } = params;

    const styleInstruction = style
      ? `Yêu cầu phong cách bản dịch: ${style}.`
      : 'Yêu cầu phong cách bản dịch: tự nhiên, chính xác, dễ đọc.';

    try {
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              'You are an expert translation assistant.',
              'Translate only from the provided content.',
              'Do not add explanations, notes, or extra commentary.',
              'Preserve the original meaning, important terminology, lists, and formatting when possible.',
              `Return only the translated content in target language: ${targetLanguage}.`,
            ].join(' '),
          },
          {
            role: 'user',
            content: `Hãy dịch nội dung dưới đây.\n\nNgôn ngữ nguồn: ${sourceLanguage}\nNgôn ngữ đích: ${targetLanguage}\n${styleInstruction}\n\nNội dung cần dịch:\n${sourceText}`,
          },
        ],
      });

      const translated = response.choices?.[0]?.message?.content?.trim();

      if (!translated) {
        throw new InternalServerErrorException('LLM returned empty translation');
      }

      return translated;
    } catch (error) {
      console.error('Failed to generate translation:', error);
      throw new InternalServerErrorException(
        'Không thể tạo translation từ AI ở thời điểm hiện tại.',
      );
    }
  }

  private serializeTranslation(
    item: TranslationWithDocument,
    summary: SummaryLookup | null = null,
  ) {
    return {
      id: item.id,
      documentId: item.documentId,
      documentTitle: item.document.title,
      documentOriginalFilename: item.document.originalFilename,
      sourceType: item.sourceType as 'DOCUMENT' | 'SUMMARY',
      sourceId: item.sourceId,
      sourceLabel:
        item.sourceType === 'SUMMARY'
          ? summary
            ? `Summary ${summary.summaryType}`
            : 'Summary'
          : 'Document content',
      sourceSummaryType: summary?.summaryType ?? null,
      sourceSummaryLanguage: summary?.language ?? null,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
      style: item.style,
      content: item.content,
      createdByAiModel: item.createdByAiModel,
      createdAt: item.createdAt,
    };
  }
}