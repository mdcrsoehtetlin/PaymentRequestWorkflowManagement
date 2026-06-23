import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitManagerDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
