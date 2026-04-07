import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ExtractionModule } from '../extraction/extraction.module';

@Module({
  imports: [PrismaModule, ExtractionModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}