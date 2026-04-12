import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListAudioVersionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải >= 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 10))
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải >= 1' })
  @Max(100, { message: 'limit không được > 100' })
  limit?: number = 10;

  @IsOptional()
  @IsUUID('4', { message: 'documentId phải là UUID hợp lệ' })
  documentId?: string;

  @IsOptional()
  @IsIn(['DOCUMENT', 'SUMMARY'], {
    message: 'sourceType chỉ được là DOCUMENT hoặc SUMMARY',
  })
  sourceType?: 'DOCUMENT' | 'SUMMARY';
}