import {
  IsNumber,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsArray,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  purpose!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  bank_account_info?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  request_content?: string;

  @IsNumber()
  @IsOptional()
  payment_method_id?: number;

  @IsDateString()
  @IsOptional()
  application_date?: string;

  @IsDateString()
  @IsOptional()
  desired_payment_date?: string;

  @IsNumber()
  @IsOptional()
  payment_type_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentBreakdownItemDto)
  @IsOptional()
  breakdowns?: PaymentBreakdownItemDto[];
}
