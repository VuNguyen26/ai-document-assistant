import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ChunksService } from '../chunks/chunks.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ExtractionService } from '../extraction/extraction.service';
import { DocumentsService } from './documents.service';
import { ListDocumentJobsQueryDto } from './dto/list-document-jobs-query.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import type { UploadedFile as UploadedDocumentFile } from './interfaces/uploaded-file.interface';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly extractionService: ExtractionService,
    private readonly chunksService: ChunksService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: UploadedDocumentFile,
  ) {
    return this.documentsService.upload(user.id, dto, file);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDocumentsQueryDto,
  ) {
    return this.documentsService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.documentsService.findOne(user.id, id);
  }

  @Get(':id/jobs')
  listJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListDocumentJobsQueryDto,
  ) {
    return this.documentsService.listDocumentJobs(
      user.id,
      id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @HttpCode(200)
  @Post(':id/process')
  process(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.documentsService.processDocument(user.id, id);
  }

  @HttpCode(200)
  @Post(':id/reprocess')
  reprocess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.documentsService.reprocessDocument(user.id, id);
  }

  @HttpCode(200)
  @Post(':id/extract')
  extract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.extractionService.extractDocument(id, user.id);
  }

  @Get(':id/chunks')
  findChunks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chunksService.listChunks(id, user.id);
  }

  @HttpCode(200)
  @Post(':id/chunk')
  chunk(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chunksService.chunkDocument(id, user.id);
  }

  @HttpCode(200)
  @Post(':id/embed')
  embed(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.embeddingsService.embedDocument(id, user.id);
  }

  @HttpCode(200)
  @Delete(':id')
  softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.documentsService.softDelete(user.id, id);
  }
}
