import { SummaryType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSummaryDto {
  @IsUUID('4', { message: 'documentId phải là UUID hợp lệ' })
  documentId: string;

  @IsEnum(SummaryType, { message: 'summaryType không hợp lệ' })
  summaryType: SummaryType;

  @IsOptional()
  @IsString({ message: 'language phải là chuỗi' })
  @MaxLength(20, { message: 'language quá dài' })
  language?: string;

  @IsOptional()
  @IsString({ message: 'promptStyle phải là chuỗi' })
  @MaxLength(100, { message: 'promptStyle quá dài' })
  promptStyle?: string;
}