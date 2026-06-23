import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  comment!: string;
}
