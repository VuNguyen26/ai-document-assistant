import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAudioVersionDto {
  @IsUUID('4', { message: 'documentId phải là UUID hợp lệ' })
  documentId!: string;

  @IsIn(['DOCUMENT', 'SUMMARY'], {
    message: 'sourceType chỉ được là DOCUMENT hoặc SUMMARY',
  })
  sourceType!: 'DOCUMENT' | 'SUMMARY';

  @ValidateIf((dto: CreateAudioVersionDto) => dto.sourceType === 'SUMMARY')
  @IsUUID('4', {
    message: 'sourceId phải là UUID hợp lệ khi sourceType = SUMMARY',
  })
  sourceId?: string;

  @IsOptional()
  @IsString({ message: 'language phải là chuỗi' })
  @MaxLength(20, { message: 'language quá dài' })
  language?: string;

  @IsOptional()
  @IsString({ message: 'voiceName phải là chuỗi' })
  @MaxLength(100, { message: 'voiceName quá dài' })
  voiceName?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsNumber({}, { message: 'speed phải là số' })
  @Min(0.25, { message: 'speed phải >= 0.25' })
  @Max(4, { message: 'speed phải <= 4' })
  speed?: number = 1;

  @IsOptional()
  @IsString({ message: 'instructions phải là chuỗi' })
  @MaxLength(500, { message: 'instructions quá dài' })
  instructions?: string;
}