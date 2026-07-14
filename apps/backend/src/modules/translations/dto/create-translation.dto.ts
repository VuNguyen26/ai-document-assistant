import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateTranslationDto {
  @IsUUID('4', { message: 'documentId phải là UUID hợp lệ' })
  documentId: string;

  @IsIn(['DOCUMENT', 'SUMMARY'], {
    message: 'sourceType chỉ được là DOCUMENT hoặc SUMMARY',
  })
  sourceType: 'DOCUMENT' | 'SUMMARY';

  @ValidateIf((dto: CreateTranslationDto) => dto.sourceType === 'SUMMARY')
  @IsUUID('4', { message: 'sourceId phải là UUID hợp lệ khi dịch từ summary' })
  sourceId?: string;

  @IsOptional()
  @IsString({ message: 'sourceLanguage phải là chuỗi' })
  @MaxLength(20, { message: 'sourceLanguage quá dài' })
  sourceLanguage?: string;

  @IsString({ message: 'targetLanguage phải là chuỗi' })
  @MaxLength(20, { message: 'targetLanguage quá dài' })
  targetLanguage: string;

  @IsOptional()
  @IsString({ message: 'style phải là chuỗi' })
  @MaxLength(100, { message: 'style quá dài' })
  style?: string;
}
