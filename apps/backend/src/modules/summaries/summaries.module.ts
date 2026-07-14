import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [SummariesController],
  providers: [SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
