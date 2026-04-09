import { DocumentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListDocumentsQueryDto {
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
  @IsString({ message: 'search phải là chuỗi' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsEnum(DocumentStatus, { message: 'status không hợp lệ' })
  status?: DocumentStatus;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'status'], {
    message: 'sortBy không hợp lệ',
  })
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder không hợp lệ' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}