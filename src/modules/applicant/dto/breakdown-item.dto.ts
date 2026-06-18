import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class BreakdownItemDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  lineNumber!: number;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  itemDate!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  unitPrice?: number;
}
