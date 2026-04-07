import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ExtractionModule } from '../extraction/extraction.module';
import { ChunksModule } from '../chunks/chunks.module';

@Module({
  imports: [PrismaModule, ExtractionModule, ChunksModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}