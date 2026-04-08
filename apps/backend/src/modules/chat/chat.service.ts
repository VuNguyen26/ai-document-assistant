import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { ListChatSessionsQueryDto } from './dto/list-chat-sessions-query.dto';
import { RagAnswerResult } from './interfaces/rag-answer-result.interface';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly maxContextChars = 7000;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
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

  async askQuestion(
    userId: string,
    dto: AskQuestionDto,
  ): Promise<RagAnswerResult> {
    const question = dto.question.trim();
    const topK = dto.topK ?? 5;

    const sessionId = dto.sessionId
      ? await this.ensureSessionOwnership(dto.sessionId, userId)
      : await this.createSession(userId, question, dto.documentId);

    const searchResult = await this.searchService.semanticSearch(userId, {
      query: question,
      documentId: dto.documentId,
      topK,
    });

    const usedChunks = searchResult.results;

    let answer =
      'Không tìm thấy đủ thông tin liên quan trong tài liệu để trả lời câu hỏi này.';

    if (usedChunks.length > 0) {
      const context = this.buildContext(usedChunks);
      answer = await this.generateAnswer(question, context);
    }

    const documentIds = [...new Set(usedChunks.map((chunk) => chunk.documentId))];

    await this.persistConversation({
      sessionId,
      userQuestion: question,
      assistantAnswer: answer,
    });

    return {
      sessionId,
      question,
      documentId: dto.documentId,
      documentIds,
      topK,
      usedChunks,
      answer,
    };
  }

  async getUserSessions(
    userId: string,
    query: ListChatSessionsQueryDto,
  ): Promise<{
    success: true;
    message: string;
    data: Array<{
    id: string;
    title: string | null;
    documentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, sessions] = await Promise.all([
      this.prisma.chatSession.count({
        where: {
          userId,
        },
      }),
      this.prisma.chatSession.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          documentId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Chat sessions fetched successfully',
      data: sessions,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getSessionMessages(
    userId: string,
    sessionId: string,
  ): Promise<{
    success: true;
    message: string;
    data: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: Date;
    }>;
  }> {
    await this.assertSessionOwnership(sessionId, userId);

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Chat messages fetched successfully',
      data: messages,
    };
  }

  private async ensureSessionOwnership(
    sessionId: string,
    userId: string,
  ): Promise<string> {
    const session = await this.prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return session.id;
  }

  private async assertSessionOwnership(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.prisma.chatSession.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this chat session',
      );
    }
  }

  private async createSession(
    userId: string,
    question: string,
    documentId?: string,
  ): Promise<string> {
    const title = this.generateSessionTitle(question);

    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        documentId: documentId ?? null,
        workspaceId: null,
        title,
        language: 'vi',
      },
      select: {
        id: true,
      },
    });

    return session.id;
  }

  private async persistConversation(params: {
    sessionId: string;
    userQuestion: string;
    assistantAnswer: string;
  }): Promise<void> {
    const { sessionId, userQuestion, assistantAnswer } = params;

    await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'USER',
          content: userQuestion,
          translatedContent: null,
        },
      }),
      this.prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: assistantAnswer,
          translatedContent: null,
        },
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);
  }

  private generateSessionTitle(question: string): string {
    const clean = question.replace(/\s+/g, ' ').trim();
    if (clean.length <= 80) {
      return clean;
    }
    return `${clean.slice(0, 77)}...`;
  }

  private buildContext(
    chunks: Array<{
      chunkId: string;
      documentId: string;
      documentName: string;
      chunkIndex: number;
      content: string;
      score: number;
    }>,
  ): string {
    let totalChars = 0;
    const parts: string[] = [];

    for (const chunk of chunks) {
      const cleanedContent = chunk.content.trim();
      const block =
        `[Document: ${chunk.documentName}]` +
        `\n[Document ID: ${chunk.documentId}]` +
        `\n[Chunk ID: ${chunk.chunkId}]` +
        `\n[Chunk Index: ${chunk.chunkIndex}]` +
        `\n[Relevance Score: ${chunk.score}]` +
        `\nContent:\n${cleanedContent}\n`;

      if (totalChars + block.length > this.maxContextChars) {
        break;
      }

      parts.push(block);
      totalChars += block.length;
    }

    return parts.join('\n---\n\n');
  }

  private async generateAnswer(
    question: string,
    context: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              'You are a retrieval-augmented assistant.',
              'Answer only from the provided context.',
              'Do not invent facts that are not supported by the context.',
              'If the context is insufficient, clearly say that the document does not provide enough information.',
              'Prefer concise, clear, and accurate answers in Vietnamese.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `Dưới đây là ngữ cảnh được truy xuất từ tài liệu:

${context}

Câu hỏi:
${question}

Yêu cầu:
- Chỉ trả lời dựa trên ngữ cảnh ở trên.
- Nếu ngữ cảnh không đủ, hãy nói rõ là không tìm thấy đủ thông tin trong tài liệu.
- Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu.`,
          },
        ],
      });

      const answer = response.choices?.[0]?.message?.content?.trim();

      if (!answer) {
        throw new InternalServerErrorException('LLM returned empty answer');
      }

      return answer;
    } catch (error) {
      console.error('Failed to generate RAG answer:', error);
      throw new InternalServerErrorException(
        'Failed to generate answer from retrieved context',
      );
    }
  }
}