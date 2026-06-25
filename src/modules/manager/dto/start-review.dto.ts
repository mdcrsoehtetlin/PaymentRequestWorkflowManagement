import { IsDateString } from 'class-validator';

export class StartReviewDto {
  @IsDateString()
  modifiedDate!: string;
}
