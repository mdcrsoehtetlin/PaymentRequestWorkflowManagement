import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRequestsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  applicant?: string;
}
