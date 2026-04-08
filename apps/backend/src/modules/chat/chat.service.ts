import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SearchService } from '../search/search.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { RagAnswerResult } from './interfaces/rag-answer-result.interface';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly maxContextChars = 7000;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
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

    const searchResult = await this.searchService.semanticSearch(userId, {
      query: question,
      documentId: dto.documentId,
      topK,
    });

    const usedChunks = searchResult.results;

    if (!usedChunks.length) {
      return {
        question,
        documentId: dto.documentId,
        documentIds: [],
        topK,
        usedChunks: [],
        answer:
          'Không tìm thấy đủ thông tin liên quan trong tài liệu để trả lời câu hỏi này.',
      };
    }

    const context = this.buildContext(usedChunks);

    const answer = await this.generateAnswer(question, context);

    const documentIds = [...new Set(usedChunks.map((chunk) => chunk.documentId))];

    return {
      question,
      documentId: dto.documentId,
      documentIds,
      topK,
      usedChunks,
      answer,
    };
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