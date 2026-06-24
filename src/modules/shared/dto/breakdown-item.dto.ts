import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
  @MaxLength(200, { message: 'Description must not exceed 200 characters' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  description?: string;

  /**
   * Amount handled as string to avoid floating-point precision loss.
   */
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'VAL-APP-007: Amount must be a valid number with up to 2 decimal places',
  })
  @Transform(({ value }): string =>
    typeof value === 'number' ? value.toString() : value || '0',
  )
  @IsNotEmpty({ groups: ['submit'] })
  @IsOptional({ groups: ['draft'] })
  amount?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Quantity must be a valid number with up to 2 decimal places',
  })
  @Transform(({ value }): string =>
    typeof value === 'number' ? value.toString() : value,
  )
  quantity?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Unit price must be a valid number with up to 2 decimal places',
  })
  @Transform(({ value }): string =>
    typeof value === 'number' ? value.toString() : value,
  )
  unitPrice?: string;
}
