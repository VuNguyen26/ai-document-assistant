import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AskQuestionDto } from './dto/ask-question.dto';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  async askQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AskQuestionDto,
  ) {
    const data = await this.chatService.askQuestion(user.id, dto);

    return {
      success: true,
      message: 'Question answered successfully',
      data,
    };
  }
}