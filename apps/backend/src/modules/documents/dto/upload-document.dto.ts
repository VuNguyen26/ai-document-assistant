import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { trimString } from '../../../common/transforms/value.transforms';

export class UploadDocumentDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1, { message: 'Tiêu đề không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề quá dài' })
  title?: string;
}
