import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { ExtractionService } from './extraction.service';

@Module({
  imports: [PrismaModule],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}