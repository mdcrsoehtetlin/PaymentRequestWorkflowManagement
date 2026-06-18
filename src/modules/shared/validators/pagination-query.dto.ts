import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description Base DTO for all list/search endpoints.
 * Extend this class in module-specific query DTOs.
 *
 * @example
 * // In applicant module:
 * export class QueryPaymentRequestsDto extends PaginationQueryDto {
 *   @IsOptional() @IsInt() statusId?: number;
 * }
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
