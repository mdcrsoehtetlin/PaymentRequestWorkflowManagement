import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('receipt_files')
export class ReceiptFile {
  @PrimaryGeneratedColumn({ name: 'receipt_file_id' })
  id!: string;

  @Column({ type: 'int' })
  payment_request_id!: string;

  @Column({ name: 'original_file_name', type: 'varchar', length: 255, nullable: true })
  file_name!: string;

  @Column({ name: 'stored_file_name', type: 'varchar', length: 255, nullable: true })
  stored_file_name!: string;

  @Column({ type: 'bigint' })
  file_size!: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type!: string;

  @Column({ name: 'file_storage_path', type: 'varchar', length: 1024 })
  storage_key!: string;

  @Column({ name: 'uploaded_by_user_id', type: 'int', nullable: true })
  uploaded_by_user_id!: number;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @CreateDateColumn({ name: 'uploaded_date' })
  created_at!: Date;

  @ManyToOne(() => PaymentRequest, request => request.receipts)
  @JoinColumn({ name: 'payment_request_id' })
  payment_request!: PaymentRequest;
}
