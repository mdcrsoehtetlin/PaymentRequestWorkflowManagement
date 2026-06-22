import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ApprovePaymentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  accountingUserId?: number;
}
