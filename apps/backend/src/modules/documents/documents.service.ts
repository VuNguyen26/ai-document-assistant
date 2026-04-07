import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { extname, basename } from 'path';

import { PrismaService } from '../../libs/prisma/prisma.service';
import type { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import type { UploadedFile } from './interfaces/uploaded-file.interface';

const DOCUMENT_SELECT = {
  id: true,
  userId: true,
  title: true,
  originalFilename: true,
  storageKey: true,
  mimeType: true,
  fileSize: true,
  sourceLanguage: true,
  pageCount: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(userId: string, dto: UploadDocumentDto, file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('File là bắt buộc');
    }

    this.validateFile(file);

    const title = this.resolveTitle(dto.title, file.originalname);
    const storageKey = `documents/${file.filename}`;

    const document = await this.prisma.document.create({
      data: {
        userId,
        title,
        originalFilename: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        status: DocumentStatus.UPLOADED,
      },
      select: DOCUMENT_SELECT,
    });

    return this.serializeDocument(document);
  }

  async findAll(userId: string, query: ListDocumentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
    };

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: DOCUMENT_SELECT,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: documents.map((document) => this.serializeDocument(document)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const document = await this.findOwnedDocumentOrThrow(userId, id);
    return this.serializeDocument(document);
  }

  async softDelete(userId: string, id: string) {
    await this.findOwnedDocumentOrThrow(userId, id);

    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Xóa tài liệu thành công',
    };
  }

  private async findOwnedDocumentOrThrow(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: DOCUMENT_SELECT,
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    return document;
  }

  private validateFile(file: UploadedFile) {
    const extension = extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    const isAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
    const isAllowedMimeType = ALLOWED_MIME_TYPES.has(mimeType);

    if (!isAllowedExtension || !isAllowedMimeType) {
      throw new BadRequestException(
        'Chỉ hỗ trợ file PDF, DOCX hoặc TXT',
      );
    }
  }

  private resolveTitle(title: string | undefined, originalFilename: string) {
    if (title?.trim()) {
      return title.trim();
    }

    const extension = extname(originalFilename);
    return basename(originalFilename, extension).trim() || 'Untitled Document';
  }

  private serializeDocument(document: {
    id: string;
    userId: string;
    title: string;
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSize: bigint;
    sourceLanguage: string | null;
    pageCount: number | null;
    status: DocumentStatus;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      ...document,
      fileSize: document.fileSize.toString(),
    };
  }
}