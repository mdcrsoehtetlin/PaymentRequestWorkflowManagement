import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BreakdownItemDto } from './breakdown-item.dto';

export class CreatePaymentRequestDto {
  @IsOptional()
  @IsInt()
  currencyId?: number;

  @IsOptional()
  @IsInt()
  paymentTypeId?: number;

  @IsOptional()
  @IsInt()
  paymentMethodId?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  purpose!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  bankAccountInfo?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  requestContent?: string;

  @IsOptional()
  @IsBoolean()
  hasReceipt?: boolean;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  totalAmount!: number;

  @IsNotEmpty()
  @IsDateString()
  desiredPaymentDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => BreakdownItemDto)
  breakdownItems!: BreakdownItemDto[];
}
