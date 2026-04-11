import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString({ message: 'name phải là chuỗi' })
  @MaxLength(120, { message: 'name quá dài' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'description phải là chuỗi' })
  @MaxLength(2000, { message: 'description quá dài' })
  description?: string;
}