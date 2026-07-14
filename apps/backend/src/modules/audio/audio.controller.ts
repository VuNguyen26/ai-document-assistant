import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AudioService } from './audio.service';
import { CreateAudioVersionDto } from './dto/create-audio-version.dto';
import { ListAudioVersionsQueryDto } from './dto/list-audio-versions-query.dto';

@Controller('audio')
@UseGuards(JwtAuthGuard)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('generate')
  async createAudioVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAudioVersionDto,
  ) {
    const data = await this.audioService.createAudioVersion(user.id, dto);

    return {
      success: true,
      message: 'Audio version generated successfully',
      data,
    };
  }

  @Get()
  async listAudioVersions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAudioVersionsQueryDto,
  ) {
    const data = await this.audioService.listAudioVersions(user.id, query);

    return {
      success: true,
      message: 'Audio versions fetched successfully',
      data,
    };
  }

  @Delete(':id')
  async deleteAudioVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.audioService.deleteAudioVersion(user.id, id);

    return {
      success: true,
      message: 'Audio version deleted successfully',
      data,
    };
  }

  @Get(':id/file')
  async streamAudioFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    return this.audioService.streamAudioFile(user.id, id, res);
  }
}
