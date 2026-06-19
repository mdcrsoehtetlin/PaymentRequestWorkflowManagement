import { IsUUID, IsNotEmpty } from 'class-validator';

export class UploadReceiptDto {
  @IsUUID()
  @IsNotEmpty()
  payment_request_id!: string;
}
