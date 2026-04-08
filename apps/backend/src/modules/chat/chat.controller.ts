import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AskQuestionDto } from './dto/ask-question.dto';
import { ChatSessionMessagesParamDto } from './dto/chat-session-messages-param.dto';
import { ListChatSessionsQueryDto } from './dto/list-chat-sessions-query.dto';
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

  @Get('sessions')
  async getMySessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListChatSessionsQueryDto,
  ) {
    return this.chatService.getUserSessions(user.id, query);
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ChatSessionMessagesParamDto,
  ) {
    return this.chatService.getSessionMessages(user.id, params.id);
  }
}