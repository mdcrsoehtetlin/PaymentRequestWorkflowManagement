import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PaymentBreakdownItem } from './payment-breakdown-item.entity';
import { ReceiptFile } from './receipt-file.entity';
import { ApprovalLog } from './approval-log.entity';

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn({ name: 'payment_request_id' })
  id!: string;

  @Column({ unique: true, type: 'varchar', length: 50 })
  request_number!: string;

  @Column({ name: 'applicant_user_id', type: 'int' })
  applicant_id!: string;

  @Column({ type: 'int' })
  status_id!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount!: string;

  @Column({ type: 'int' })
  currency_id!: number;

  @Column({ type: 'date' })
  application_date!: string;

  @Column({ type: 'date' })
  desired_payment_date!: string;

  @Column({ type: 'int' })
  payment_method_id!: number;

  @Column({ type: 'boolean', default: false })
  has_receipt!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @CreateDateColumn({ name: 'created_date' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'modified_date' })
  updated_at!: Date;

  @OneToMany(() => PaymentBreakdownItem, item => item.payment_request)
  breakdowns!: PaymentBreakdownItem[];

  @OneToMany(() => ReceiptFile, file => file.payment_request)
  receipts!: ReceiptFile[];

  @OneToMany(() => ApprovalLog, log => log.payment_request)
  logs!: ApprovalLog[];
}
