import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../libs/prisma/prisma.module';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AudioController],
  providers: [AudioService],
  exports: [AudioService],
})
export class AudioModule {}
