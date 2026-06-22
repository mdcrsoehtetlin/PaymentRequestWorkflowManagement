import { IsString, IsDateString, Length } from 'class-validator';

export class RejectRequestDto {
  @IsDateString()
  modifiedDate!: string;

  @IsString()
  @Length(10, 500, {
    message: '差し戻し理由は10文字以上500文字以内で入力してください。',
  })
  comment!: string;
}
