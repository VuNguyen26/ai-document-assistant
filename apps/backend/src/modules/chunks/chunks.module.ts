import { Module } from '@nestjs/common';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { ChunksService } from './chunks.service';

@Module({
  imports: [PrismaModule],
  providers: [ChunksService],
  exports: [ChunksService],
})
export class ChunksModule {}