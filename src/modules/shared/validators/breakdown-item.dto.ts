import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description DTO for a single payment breakdown line item.
 * Supports two validation modes via class-validator groups:
 * - 'draft': relaxed — most fields optional
 * - 'submit': strict — all required fields must be present
 *
 * @example
 * // In CreatePaymentRequestDto:
 * @IsArray()
 * @ArrayMinSize(1, { groups: ['submit'] })
 * @ArrayMaxSize(15)
 * @ValidateNested({ each: true })
 * @Type(() => BreakdownItemDto)
 * breakdownItems: BreakdownItemDto[];
 */
export class BreakdownItemDto {
  @IsDateString()
  @IsNotEmpty({ groups: ['submit'] })
  @IsOptional({ groups: ['draft'] })
  itemDate?: string;

  @IsString()
  @IsNotEmpty({ groups: ['submit'] })
  @IsOptional({ groups: ['draft'] })
  @MaxLength(200, { message: '品目説明は200文字以内で入力してください' })
  description?: string;

  /**
   * Amount as a number in the DTO — TypeORM stores as NUMERIC string.
   * Min enforced only on submit to allow drafts with 0 amount.
   */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { groups: ['submit'], message: 'VAL-APP-007: 金額は0より大きい値を入力してください' })
  @Max(9999999999.99)
  @IsOptional({ groups: ['draft'] })
  amount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  quantity?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;
}
