import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [PrismaModule],
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
