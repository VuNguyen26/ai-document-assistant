import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { ChunksModule } from '../chunks/chunks.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { DocumentsController } from './documents.controller';
import { DocumentPipelineService } from './document-pipeline.service';
import { DocumentProcessingJobsService } from './document-processing-jobs.service';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, ExtractionModule, ChunksModule, EmbeddingsModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentPipelineService,
    DocumentProcessingJobsService,
  ],
  exports: [
    DocumentsService,
    DocumentPipelineService,
    DocumentProcessingJobsService,
  ],
})
export class DocumentsModule {}