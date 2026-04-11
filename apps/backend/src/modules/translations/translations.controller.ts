import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { ListTranslationsQueryDto } from './dto/list-translations-query.dto';
import { TranslationsService } from './translations.service';

@Controller('translations')
@UseGuards(JwtAuthGuard)
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Post('generate')
  async createTranslation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTranslationDto,
  ) {
    const data = await this.translationsService.createTranslation(user.id, dto);

    return {
      success: true,
      message: 'Translation generated successfully',
      data,
    };
  }

  @Get()
  async listTranslations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTranslationsQueryDto,
  ) {
    const data = await this.translationsService.listTranslations(user.id, query);

    return {
      success: true,
      message: 'Translations fetched successfully',
      data,
    };
  }

  @Delete(':id')
  async deleteTranslation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.translationsService.deleteTranslation(user.id, id);

    return {
      success: true,
      message: 'Translation deleted successfully',
      data,
    };
  }
}