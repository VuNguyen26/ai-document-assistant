import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { CreateAudioVersionDto } from './dto/create-audio-version.dto';
import { ListAudioVersionsQueryDto } from './dto/list-audio-versions-query.dto';

const MAX_INPUT_CHARS = 4000;
const DEFAULT_VOICE = 'alloy';
const DEFAULT_SPEED = 1;
const DEFAULT_STATUS = 'READY';
const DEFAULT_AUDIO_FORMAT = 'mp3';

type SummaryLookup = {
  id: string;
  summaryType: string;
  language: string;
};

type AudioWithDocument = Prisma.AudioVersionGetPayload<{
  include: {
    document: {
      select: {
        id: true;
        title: true;
        originalFilename: true;
        userId: true;
      };
    };
  };
}>;

type OpenRouterAudioDelta = {
  data?: string;
  transcript?: string;
};

type OpenRouterChunk = {
  choices?: Array<{
    delta?: {
      audio?: OpenRouterAudioDelta;
    };
  }>;
};

@Injectable()
export class AudioService {
  private readonly openRouterApiKey: string;
  private readonly ttsModel: string;
  private readonly openRouterBaseUrl = 'https://openrouter.ai/api/v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing in environment variables');
    }

    this.openRouterApiKey = apiKey;
    this.ttsModel =
      this.configService.get<string>('OPENROUTER_TTS_MODEL') ||
      'openai/gpt-audio-mini';
  }

  async createAudioVersion(userId: string, dto: CreateAudioVersionDto) {
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
    const voiceName = (dto.voiceName?.trim() || DEFAULT_VOICE) as string;
    const speed = dto.speed ?? DEFAULT_SPEED;
    const instructions = dto.instructions?.trim() || undefined;

    let sourceId: string | null = dto.sourceId?.trim() || null;
    let sourceText = '';
    let language = dto.language?.trim() || document.sourceLanguage || 'auto';
    let summaryLookup: SummaryLookup | null = null;

    if (sourceType === 'DOCUMENT') {
      sourceText =
        document.content?.cleanedText || document.content?.extractedText || '';
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
      language = dto.language?.trim() || summary.language || language;

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
          : 'Summary hiện không có nội dung để tạo audio.',
      );
    }

    const trimmedInput = sourceText.slice(0, MAX_INPUT_CHARS);

    const uploadDir = join(process.cwd(), 'uploads', 'audio');
    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${DEFAULT_AUDIO_FORMAT}`;
    const relativeStorageKey = `audio/${filename}`;
    const absoluteFilePath = join(process.cwd(), 'uploads', relativeStorageKey);

    try {
      const audioBuffer = await this.generateAudioWithOpenRouter({
        input: trimmedInput,
        language,
        voiceName,
        speed,
        instructions,
      });

      await writeFile(absoluteFilePath, audioBuffer);

      const created = await this.prisma.audioVersion.create({
        data: {
          documentId: document.id,
          sourceType,
          sourceId,
          language,
          voiceName,
          speed: new Prisma.Decimal(String(speed)),
          audioStorageKey: relativeStorageKey,
          durationSeconds: null,
          status: DEFAULT_STATUS,
        },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalFilename: true,
              userId: true,
            },
          },
        },
      });

      return this.serializeAudioVersion(created, summaryLookup);
    } catch (error) {
      console.error('Failed to generate audio version with OpenRouter:', error);
      throw new InternalServerErrorException(
        'Không thể tạo audio từ OpenRouter ở thời điểm hiện tại.',
      );
    }
  }

  async listAudioVersions(userId: string, query: ListAudioVersionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AudioVersionWhereInput = {
      document: {
        userId,
        deletedAt: null,
      },
      ...(query.documentId ? { documentId: query.documentId } : {}),
      ...(query.sourceType ? { sourceType: query.sourceType } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.audioVersion.findMany({
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
              userId: true,
            },
          },
        },
      }),
      this.prisma.audioVersion.count({ where }),
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
        this.serializeAudioVersion(
          item,
          item.sourceId ? (summaryMap.get(item.sourceId) ?? null) : null,
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

  async deleteAudioVersion(userId: string, audioId: string) {
    const audio = await this.prisma.audioVersion.findUnique({
      where: {
        id: audioId,
      },
      include: {
        document: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException('Audio version not found');
    }

    if (!audio.document || audio.document.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this audio version',
      );
    }

    const absoluteFilePath = join(
      process.cwd(),
      'uploads',
      audio.audioStorageKey,
    );

    try {
      await unlink(absoluteFilePath);
    } catch {
      // ignore file deletion errors
    }

    await this.prisma.audioVersion.delete({
      where: {
        id: audioId,
      },
    });

    return {
      id: audioId,
    };
  }

  async streamAudioFile(userId: string, audioId: string, res: Response) {
    const audio = await this.prisma.audioVersion.findUnique({
      where: {
        id: audioId,
      },
      include: {
        document: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException('Audio version not found');
    }

    if (!audio.document || audio.document.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this audio file',
      );
    }

    const absoluteFilePath = join(
      process.cwd(),
      'uploads',
      audio.audioStorageKey,
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${audio.id}.mp3"`);

    const stream = createReadStream(absoluteFilePath);

    stream.on('error', () => {
      res.status(404).json({
        success: false,
        message: 'Audio file not found',
      });
    });

    stream.pipe(res);
  }

  private async generateAudioWithOpenRouter(params: {
    input: string;
    language: string;
    voiceName: string;
    speed: number;
    instructions?: string;
  }): Promise<Buffer> {
    const { input, language, voiceName, speed, instructions } = params;

    const systemPrompt = [
      'You are a text-to-speech generation assistant.',
      'Generate natural audio for the provided text.',
      'Do not add any extra words beyond the intended spoken content.',
      'The output should sound clear and natural.',
      `Preferred spoken language: ${language}.`,
      instructions ? `Voice instructions: ${instructions}.` : '',
      `Preferred speaking speed hint: ${speed}.`,
      'The response must include audio output.',
    ]
      .filter(Boolean)
      .join(' ');

    const response = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.ttsModel,
        stream: true,
        modalities: ['text', 'audio'],
        audio: {
          voice: voiceName,
          format: DEFAULT_AUDIO_FORMAT,
        },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: input,
          },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `OpenRouter audio request failed: ${response.status} ${errorText}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    const audioBase64Chunks: string[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (buffer.includes('\n\n')) {
        const separatorIndex = buffer.indexOf('\n\n');
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const lines = rawEvent.split('\n');
        const dataLines = lines
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.replace('data:', '').trim());

        if (dataLines.length === 0) continue;

        const joinedData = dataLines.join('\n');

        if (joinedData === '[DONE]') {
          continue;
        }

        let parsed: OpenRouterChunk | null = null;

        try {
          parsed = JSON.parse(joinedData) as OpenRouterChunk;
        } catch {
          parsed = null;
        }

        const audioDelta = parsed?.choices?.[0]?.delta?.audio;

        if (audioDelta?.data) {
          audioBase64Chunks.push(audioDelta.data);
        }
      }
    }

    if (audioBase64Chunks.length === 0) {
      throw new Error('OpenRouter returned no audio data');
    }

    return Buffer.from(audioBase64Chunks.join(''), 'base64');
  }

  private serializeAudioVersion(
    item: AudioWithDocument,
    summary: SummaryLookup | null = null,
  ) {
    return {
      id: item.id,
      documentId: item.documentId,
      documentTitle: item.document?.title ?? null,
      documentOriginalFilename: item.document?.originalFilename ?? null,
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
      language: item.language,
      voiceName: item.voiceName,
      speed: Number(item.speed),
      audioStorageKey: item.audioStorageKey,
      durationSeconds: item.durationSeconds,
      status: item.status,
      createdAt: item.createdAt,
      fileUrl: `/api/v1/audio/${item.id}/file`,
    };
  }
}
