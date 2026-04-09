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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { ListSummariesQueryDto } from './dto/list-summaries-query.dto';
import { SummariesService } from './summaries.service';

@Controller('summaries')
@UseGuards(JwtAuthGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post('generate')
  async createSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSummaryDto,
  ) {
    const data = await this.summariesService.createSummary(user.id, dto);

    return {
      success: true,
      message: 'Summary generated successfully',
      data,
    };
  }

  @Get()
  async listSummaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSummariesQueryDto,
  ) {
    const data = await this.summariesService.listSummaries(user.id, query);

    return {
      success: true,
      message: 'Summaries fetched successfully',
      data,
    };
  }

  @Delete(':id')
  async deleteSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.summariesService.deleteSummary(user.id, id);

    return {
      success: true,
      message: 'Summary deleted successfully',
      data,
    };
  }
}