import {
  IsNumber,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsArray,
  IsString,
} from 'class-validator';
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

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  purpose!: string;

  @IsDateString()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  bankAccountInfo?: string;

  @IsNumber()
  @IsOptional()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  requestContent?: string;

  @IsNumber()
  @IsOptional()
  payment_method_id?: number;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  request_content?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentBreakdownItemDto)
  @IsOptional()
  breakdowns?: PaymentBreakdownItemDto[];
}
