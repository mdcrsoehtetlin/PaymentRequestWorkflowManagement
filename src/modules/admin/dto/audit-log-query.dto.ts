import {
  IsOptional,
  IsInt,
  IsString,
  MaxLength,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  actionTypeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  requestNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  actorName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 50;
}
