import { IsOptional, IsString, IsDateString, Length } from 'class-validator';

export class ApproveRequestDto {
  @IsDateString()
  modifiedDate!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'コメントは500文字以内で入力してください。' })
  comment?: string;
}
