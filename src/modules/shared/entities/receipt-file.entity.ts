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
  id!: number;

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

  @Column({ type: 'bigint', nullable: true })
  file_size!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type!: string;

  @Column({
    name: 'file_storage_path',
    type: 'varchar',
    length: 1024,
    nullable: true,
  })
  storage_key!: string;

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
