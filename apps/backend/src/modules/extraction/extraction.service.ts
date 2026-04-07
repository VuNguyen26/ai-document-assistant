import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { franc } from 'franc';

import { PrismaService } from '../../libs/prisma/prisma.service';
import { cleanExtractedText } from './cleaners/text-cleaner';
import { parseTxt } from './parsers/txt.parser';
import { parsePdf } from './parsers/pdf.parser';
import { parseDocx } from './parsers/docx.parser';

const SUPPORTED_EXTRACTION_MIME_TYPES = new Set<string>([
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

@Injectable()
export class ExtractionService {
  constructor(private readonly prisma: PrismaService) {}

  async extractDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        originalFilename: true,
        mimeType: true,
        storageKey: true,
        status: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.storageKey) {
      await this.markDocumentFailed(document.id);
      throw new BadRequestException('Document storage key is missing');
    }

    if (!SUPPORTED_EXTRACTION_MIME_TYPES.has(document.mimeType)) {
      await this.markDocumentFailed(document.id);
      throw new BadRequestException(
        'This document type is not supported for extraction',
      );
    }

    const absoluteFilePath = path.join(
      process.cwd(),
      'uploads',
      document.storageKey,
    );

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absoluteFilePath);
    } catch {
      await this.markDocumentFailed(document.id);
      throw new NotFoundException('Document file not found on local storage');
    }

    let extractedText = '';

    try {
      extractedText = await this.parseByMimeType(
        document.mimeType,
        fileBuffer,
        document.originalFilename,
      );
    } catch (error) {
      await this.markDocumentFailed(document.id);

      const message =
        error instanceof Error ? error.message : 'Unknown extraction error';

      throw new InternalServerErrorException(
        `Failed to extract document: ${message}`,
      );
    }

    const cleanedText = cleanExtractedText(extractedText);
    const textLength = cleanedText.length;
    const detectedLanguage = this.detectLanguage(cleanedText);

    try {
      await this.prisma.$transaction([
        this.prisma.documentContent.upsert({
          where: {
            documentId: document.id,
          },
          update: {
            extractedText,
            cleanedText,
            textLength,
            detectedLanguage,
          },
          create: {
            documentId: document.id,
            extractedText,
            cleanedText,
            textLength,
            detectedLanguage,
          },
        }),
        this.prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            status: 'READY',
          },
        }),
      ]);
    } catch (error) {
      await this.markDocumentFailed(document.id);

      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      throw new InternalServerErrorException(
        `Failed to save extracted content: ${message}`,
      );
    }

    return {
      message: 'Document extracted successfully',
      data: {
        documentId: document.id,
        status: 'READY',
        textLength,
        detectedLanguage,
        overwritten: true,
      },
    };
  }

  private async parseByMimeType(
    mimeType: string,
    buffer: Buffer,
    originalFilename?: string | null,
  ): Promise<string> {
    if (mimeType === 'text/plain') {
      return parseTxt(buffer);
    }

    if (mimeType === 'application/pdf') {
      return parsePdf(buffer);
    }

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return parseDocx(buffer);
    }

    if (mimeType === 'application/octet-stream') {
      const extension = path.extname(originalFilename ?? '').toLowerCase();

      if (extension === '.txt') {
        return parseTxt(buffer);
      }

      if (extension === '.pdf') {
        return parsePdf(buffer);
      }

      if (extension === '.docx') {
        return parseDocx(buffer);
      }
    }

    throw new BadRequestException('Unsupported file type for extraction');
  }

  private detectLanguage(text: string): string {
    if (!text || text.trim().length < 20) {
      return 'und';
    }

    const result = franc(text, { minLength: 20 });

    if (result === 'und') {
      return 'und';
    }

    return result;
  }

  private async markDocumentFailed(documentId: string): Promise<void> {
    await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: 'FAILED',
      },
    });
  }
}