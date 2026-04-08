import { IsUUID } from 'class-validator';

export class ChatSessionMessagesParamDto {
  @IsUUID()
  id!: string;
}