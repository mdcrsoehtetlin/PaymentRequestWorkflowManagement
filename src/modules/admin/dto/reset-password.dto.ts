import { IsNotEmpty, IsNumber } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsNumber()
  version!: number;
}
