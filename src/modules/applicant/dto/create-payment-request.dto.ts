import { IsNumber, IsOptional, ValidateNested, IsDateString, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentBreakdownItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  amount!: number;
}

export class CreatePaymentRequestDraftDto {
  @IsNumber()
  @IsOptional()
  currency_id?: number;

  @IsDateString()
  @IsOptional()
  application_date?: string;

  @IsDateString()
  @IsOptional()
  desired_payment_date?: string;

  @IsNumber()
  @IsOptional()
  payment_method_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentBreakdownItemDto)
  @IsOptional()
  breakdowns?: PaymentBreakdownItemDto[];
}
