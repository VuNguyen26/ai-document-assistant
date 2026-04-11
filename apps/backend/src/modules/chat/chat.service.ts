import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { ListChatSessionsQueryDto } from './dto/list-chat-sessions-query.dto';
import {
  RagAnswerResult,
  RagUsedChunk,
} from './interfaces/rag-answer-result.interface';

type OwnedSession = {
  id: string;
  documentId: string | null;
  workspaceId: string | null;
};

type PersistedChatCitation = {
  id: string;
  messageId: string;
  chunkId: string | null;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number | null;
  endOffset: number | null;
  distance: number;
  score: number;
};

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

    if (!question) {
      throw new BadRequestException('Question must not be empty');
    }

    if (dto.documentId && dto.workspaceId) {
      throw new BadRequestException(
        'documentId và workspaceId không được truyền cùng lúc',
      );
    }

    const topK = dto.topK ?? 5;

    const existingSession = dto.sessionId
      ? await this.getOwnedSessionOrThrow(dto.sessionId, userId)
      : null;

    this.validateSessionScope(existingSession, dto);

    const effectiveDocumentId =
      dto.documentId ?? existingSession?.documentId ?? undefined;
    const effectiveWorkspaceId =
      dto.workspaceId ?? existingSession?.workspaceId ?? undefined;

    await this.assertChatScope(userId, effectiveDocumentId, effectiveWorkspaceId);

    const sessionId =
      existingSession?.id ??
      (await this.createSession(userId, question, {
        documentId: effectiveDocumentId,
        workspaceId: effectiveWorkspaceId,
      }));

    const searchResult = await this.searchService.semanticSearch(userId, {
      query: question,
      documentId: effectiveDocumentId,
      workspaceId: effectiveWorkspaceId,
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
      citations: usedChunks,
    });

    return {
      sessionId,
      question,
      documentId: effectiveDocumentId,
      workspaceId: effectiveWorkspaceId,
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
      workspaceId: string | null;
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

    if (query.documentId && query.workspaceId) {
      throw new BadRequestException(
        'documentId và workspaceId không được truyền cùng lúc',
      );
    }

    const where = {
      userId,
      ...(query.documentId ? { documentId: query.documentId } : {}),
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
    };

    const [total, sessions] = await Promise.all([
      this.prisma.chatSession.count({ where }),
      this.prisma.chatSession.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          documentId: true,
          workspaceId: true,
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
      citations: Array<{
        id: string;
        chunkId: string | null;
        documentId: string;
        documentName: string;
        chunkIndex: number;
        content: string;
        charCount: number;
        startOffset: number | null;
        endOffset: number | null;
        distance: number;
        score: number;
      }>;
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

    const messageIds = messages.map((message) => message.id);

    const citations = messageIds.length
      ? await this.prisma.$queryRawUnsafe<PersistedChatCitation[]>(
          `
            SELECT
              cc.id AS "id",
              cc.message_id AS "messageId",
              cc.chunk_id AS "chunkId",
              cc.document_id AS "documentId",
              cc.document_name AS "documentName",
              cc.chunk_index AS "chunkIndex",
              cc.content AS "content",
              cc.char_count AS "charCount",
              cc.start_offset AS "startOffset",
              cc.end_offset AS "endOffset",
              cc.distance AS "distance",
              cc.score AS "score"
            FROM chat_citations cc
            WHERE cc.message_id IN (${this.joinUuidList(messageIds)})
            ORDER BY cc.created_at ASC
          `,
        )
      : [];

    const citationMap = new Map<string, PersistedChatCitation[]>();

    for (const citation of citations) {
      const current = citationMap.get(citation.messageId) ?? [];
      current.push(citation);
      citationMap.set(citation.messageId, current);
    }

    return {
      success: true,
      message: 'Chat messages fetched successfully',
      data: messages.map((message) => ({
        ...message,
        citations: (citationMap.get(message.id) ?? []).map((citation) => ({
          id: citation.id,
          chunkId: citation.chunkId,
          documentId: citation.documentId,
          documentName: citation.documentName,
          chunkIndex: citation.chunkIndex,
          content: citation.content,
          charCount: citation.charCount,
          startOffset: citation.startOffset,
          endOffset: citation.endOffset,
          distance: Number(citation.distance),
          score: Number(citation.score),
        })),
      })),
    };
  }

  async deleteSession(
    userId: string,
    sessionId: string,
  ): Promise<{
    success: true;
    message: string;
    data: {
      id: string;
    };
  }> {
    await this.assertSessionOwnership(sessionId, userId);

    await this.prisma.$transaction([
      this.prisma.chatMessage.deleteMany({
        where: {
          sessionId,
        },
      }),
      this.prisma.chatSession.delete({
        where: {
          id: sessionId,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Chat session deleted successfully',
      data: {
        id: sessionId,
      },
    };
  }

  async updateSessionTitle(
    userId: string,
    sessionId: string,
    dto: { title: string },
  ): Promise<{
    success: true;
    message: string;
    data: {
      id: string;
      title: string | null;
    };
  }> {
    await this.assertSessionOwnership(sessionId, userId);

    const updated = await this.prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        title: dto.title,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
      },
    });

    return {
      success: true,
      message: 'Chat session updated successfully',
      data: updated,
    };
  }

  private async getOwnedSessionOrThrow(
    sessionId: string,
    userId: string,
  ): Promise<OwnedSession> {
    const session = await this.prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        documentId: true,
        workspaceId: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return session;
  }

  private validateSessionScope(
    existingSession: OwnedSession | null,
    dto: AskQuestionDto,
  ): void {
    if (!existingSession) return;

    if (
      existingSession.documentId &&
      dto.documentId &&
      existingSession.documentId !== dto.documentId
    ) {
      throw new BadRequestException(
        'This chat session does not belong to the provided document',
      );
    }

    if (
      existingSession.workspaceId &&
      dto.workspaceId &&
      existingSession.workspaceId !== dto.workspaceId
    ) {
      throw new BadRequestException(
        'This chat session does not belong to the provided workspace',
      );
    }

    if (existingSession.documentId && dto.workspaceId) {
      throw new BadRequestException(
        'This chat session belongs to a document, not a workspace',
      );
    }

    if (existingSession.workspaceId && dto.documentId) {
      throw new BadRequestException(
        'This chat session belongs to a workspace, not a document',
      );
    }
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

  private async assertChatScope(
    userId: string,
    documentId?: string,
    workspaceId?: string,
  ): Promise<void> {
    if (documentId && workspaceId) {
      throw new BadRequestException(
        'documentId và workspaceId không được truyền cùng lúc',
      );
    }

    if (documentId) {
      await this.assertDocumentReadyForChat(documentId, userId);
    }

    if (workspaceId) {
      await this.assertWorkspaceReadyForChat(workspaceId, userId);
    }
  }

  private async assertDocumentReadyForChat(
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
        'Document is not ready for chat. Please run extract, chunk, and embed first.',
      );
    }
  }

  private async assertWorkspaceReadyForChat(
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
        documents: {
          select: {
            document: {
              select: {
                id: true,
                status: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const readyCount = workspace.documents.filter(
      (item) =>
        item.document.deletedAt === null && item.document.status === 'READY',
    ).length;

    if (readyCount === 0) {
      throw new BadRequestException(
        'Workspace chưa có document READY để chat. Hãy process ít nhất một tài liệu trước.',
      );
    }
  }

  private async createSession(
    userId: string,
    question: string,
    scope?: {
      documentId?: string;
      workspaceId?: string;
    },
  ): Promise<string> {
    const title = await this.generateSmartSessionTitle(question);

    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        documentId: scope?.documentId ?? null,
        workspaceId: scope?.workspaceId ?? null,
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
    citations: RagUsedChunk[];
  }): Promise<void> {
    const { sessionId, userQuestion, assistantAnswer, citations } = params;

    await this.prisma.$transaction(async (tx) => {
      await tx.chatMessage.create({
        data: {
          sessionId,
          role: 'USER',
          content: userQuestion,
          translatedContent: null,
        },
      });

      const assistantMessage = await tx.chatMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: assistantAnswer,
          translatedContent: null,
        },
        select: {
          id: true,
        },
      });

      if (citations.length > 0) {
        for (const citation of citations) {
          await tx.$executeRaw`
            INSERT INTO chat_citations (
              id,
              message_id,
              chunk_id,
              document_id,
              document_name,
              chunk_index,
              content,
              char_count,
              start_offset,
              end_offset,
              distance,
              score,
              created_at
            ) VALUES (
              ${randomUUID()},
              ${assistantMessage.id},
              ${citation.chunkId},
              ${citation.documentId},
              ${citation.documentName},
              ${citation.chunkIndex},
              ${citation.content},
              ${citation.charCount},
              ${citation.startOffset},
              ${citation.endOffset},
              ${citation.distance},
              ${citation.score},
              NOW()
            )
          `;
        }
      }

      await tx.chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
        },
      });
    });
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
            content: `Dưới đây là ngữ cảnh được truy xuất từ tài liệu:\n\n${context}\n\nCâu hỏi:\n${question}\n\nYêu cầu:\n- Chỉ trả lời dựa trên ngữ cảnh ở trên.\n- Nếu ngữ cảnh không đủ, hãy nói rõ là không tìm thấy đủ thông tin trong tài liệu.\n- Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu.`,
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

  private async generateSmartSessionTitle(question: string): Promise<string> {
    const fallbackTitle = this.generateSessionTitle(question);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              'You generate short chat titles.',
              'Return ONLY the title.',
              'No quotes.',
              'Max 8 words.',
              'Vietnamese.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `Tạo tiêu đề ngắn cho câu hỏi:\n${question}`,
          },
        ],
      });

      const title = response.choices?.[0]?.message?.content?.trim();

      if (!title) {
        return fallbackTitle;
      }

      return title.length > 255 ? title.slice(0, 255) : title;
    } catch (error) {
      console.error('Generate title failed:', error);
      return fallbackTitle;
    }
  }

  async streamQuestion(
    userId: string,
    dto: AskQuestionDto,
    res: import('express').Response,
  ): Promise<void> {
    const question = dto.question.trim();

    if (!question) {
      throw new BadRequestException('Question must not be empty');
    }

    if (dto.documentId && dto.workspaceId) {
      throw new BadRequestException(
        'documentId và workspaceId không được truyền cùng lúc',
      );
    }

    const topK = dto.topK ?? 5;

    const existingSession = dto.sessionId
      ? await this.getOwnedSessionOrThrow(dto.sessionId, userId)
      : null;

    this.validateSessionScope(existingSession, dto);

    const effectiveDocumentId =
      dto.documentId ?? existingSession?.documentId ?? undefined;
    const effectiveWorkspaceId =
      dto.workspaceId ?? existingSession?.workspaceId ?? undefined;

    await this.assertChatScope(userId, effectiveDocumentId, effectiveWorkspaceId);

    const sessionId =
      existingSession?.id ??
      (await this.createSession(userId, question, {
        documentId: effectiveDocumentId,
        workspaceId: effectiveWorkspaceId,
      }));

    const searchResult = await this.searchService.semanticSearch(userId, {
      query: question,
      documentId: effectiveDocumentId,
      workspaceId: effectiveWorkspaceId,
      topK,
    });

    const usedChunks = searchResult.results;
    const documentIds = [...new Set(usedChunks.map((chunk) => chunk.documentId))];

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('meta', {
      sessionId,
      question,
      documentId: effectiveDocumentId ?? null,
      workspaceId: effectiveWorkspaceId ?? null,
      documentIds,
      topK,
      usedChunks,
    });

    let answer =
      'Không tìm thấy đủ thông tin liên quan trong tài liệu để trả lời câu hỏi này.';

    try {
      if (usedChunks.length === 0) {
        sendEvent('delta', { content: answer });
      } else {
        const context = this.buildContext(usedChunks);
        answer = await this.generateAnswerStream(question, context, sendEvent);
      }

      await this.persistConversation({
        sessionId,
        userQuestion: question,
        assistantAnswer: answer,
        citations: usedChunks,
      });

      sendEvent('done', {
        sessionId,
        answer,
      });

      res.end();
    } catch (error) {
      console.error('Failed to stream RAG answer:', error);

      sendEvent('error', {
        message: 'Failed to stream answer from retrieved context',
      });

      res.end();
    }
  }

  private async generateAnswerStream(
    question: string,
    context: string,
    sendEvent: (event: string, data: unknown) => void,
  ): Promise<string> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: 0.2,
        stream: true,
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
            content: `Dưới đây là ngữ cảnh được truy xuất từ tài liệu:\n\n${context}\n\nCâu hỏi:\n${question}\n\nYêu cầu:\n- Chỉ trả lời dựa trên ngữ cảnh ở trên.\n- Nếu ngữ cảnh không đủ, hãy nói rõ là không tìm thấy đủ thông tin trong tài liệu.\n- Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu.`,
          },
        ],
      });

      let fullAnswer = '';

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content ?? '';

        if (!delta) {
          continue;
        }

        fullAnswer += delta;
        sendEvent('delta', { content: delta });
      }

      const finalAnswer = fullAnswer.trim();

      if (!finalAnswer) {
        throw new InternalServerErrorException(
          'LLM returned empty streamed answer',
        );
      }

      return finalAnswer;
    } catch (error) {
      console.error('Failed to generate streamed RAG answer:', error);
      throw new InternalServerErrorException(
        'Failed to generate streamed answer from retrieved context',
      );
    }
  }

  private joinUuidList(values: string[]): string {
    return values.map((value) => `'${value}'`).join(', ');
  }
}