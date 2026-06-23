import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('receipt_files')
export class ReceiptFile {
  @PrimaryGeneratedColumn({ name: 'receipt_file_id' })
  receiptFileId!: number;

  @Column({ name: 'payment_request_id', type: 'int' })
  paymentRequestId!: number;

  @Column({
    name: 'original_file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  originalFileName!: string;

  @Column({
    name: 'stored_file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  storedFileName!: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize!: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'file_storage_path', type: 'varchar', length: 1024 })
  fileStoragePath!: string;

  @Column({ name: 'uploaded_by_user_id', type: 'int', nullable: true })
  uploadedByUserId!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'uploaded_date' })
  uploadedDate!: Date;

  @ManyToOne('PaymentRequest', 'receiptFiles')
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;
}
