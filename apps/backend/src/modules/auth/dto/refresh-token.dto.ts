import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'refreshToken là bắt buộc' })
  refreshToken!: string;
}
