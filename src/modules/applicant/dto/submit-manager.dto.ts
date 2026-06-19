import { IsUUID, IsNotEmpty } from 'class-validator';

export class SubmitManagerDto {
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
