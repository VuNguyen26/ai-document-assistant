import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SemanticSearchDto } from './dto/semantic-search.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async semanticSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SemanticSearchDto,
  ) {
    const data = await this.searchService.semanticSearch(user.id, dto);

    return {
      success: true,
      message: 'Semantic search completed successfully',
      data,
    };
  }
}