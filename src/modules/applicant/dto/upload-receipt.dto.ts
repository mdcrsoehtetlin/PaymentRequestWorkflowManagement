import { IsString, IsNotEmpty } from 'class-validator';

export class UploadReceiptDto {
  @IsString()
  @IsNotEmpty()
  payment_request_id!: string;
}
