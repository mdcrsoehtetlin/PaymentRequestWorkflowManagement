import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from './user.entity';

@Entity('receipt_files')
export class ReceiptFile {
  @PrimaryGeneratedColumn({ name: 'receipt_file_id' })
  receiptFileId: number;

  @Column({ name: 'payment_request_id' })
  paymentRequestId: number;

  @ManyToOne(() => PaymentRequest, (request) => request.receiptFiles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest: PaymentRequest;

  @Column({ name: 'original_file_name', length: 255 })
  originalFileName: string;

  @Column({ name: 'stored_file_name', length: 255 })
  storedFileName: string;

  @Column({ name: 'file_storage_path', length: 500 })
  fileStoragePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: string; // BIGINT is mapped to string in JS

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'uploaded_by_user_id' })
  uploadedByUserId: number;

  @ManyToOne(() => User, (user) => user.uploadedReceipts, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedByUser: User;

  @CreateDateColumn({ name: 'uploaded_date', type: 'timestamp with time zone' })
  uploadedDate: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
