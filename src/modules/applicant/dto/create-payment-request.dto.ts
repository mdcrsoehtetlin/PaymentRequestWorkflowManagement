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
import { Type, Transform } from 'class-transformer';

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
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  purpose!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  bankAccountInfo?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  requestContent?: string;

  @IsNumber()
  @IsOptional()
  payment_method_id?: number;

  @IsString()
  @IsOptional()
  request_content?: string;

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
