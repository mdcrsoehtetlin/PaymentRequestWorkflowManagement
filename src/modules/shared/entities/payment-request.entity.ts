import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentBreakdownItem } from './payment-breakdown-item.entity';
import { ReceiptFile } from './receipt-file.entity';
import { ApprovalLog } from './approval-log.entity';
import { User } from './user.entity';

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn({ name: 'payment_request_id' })
  id!: string;

  @Column({ unique: true, type: 'varchar', length: 50 })
  request_number!: string;

  @Column({ name: 'applicant_user_id', type: 'int' })
  applicant_id!: string;

  @Column({ name: 'manager_user_id', type: 'int', nullable: true })
  manager_user_id!: number | null;

  @Column({ name: 'final_approver_user_id', type: 'int', nullable: true })
  final_approver_user_id!: number | null;

  @Column({ name: 'accounting_user_id', type: 'int', nullable: true })
  accounting_user_id!: number | null;

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
  payment_type_id!: number;

  @Column({ type: 'int' })
  payment_method_id!: number;

  @Column({ type: 'varchar', length: 500 })
  purpose!: string;

  @Column({ type: 'text' })
  request_content!: string;

  @Column({ name: 'bank_account_info', type: 'text', nullable: true })
  bank_account_info!: string | null;

  @Column({ type: 'boolean', default: false })
  has_receipt!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ name: 'submitted_to_manager_date', type: 'date', nullable: true })
  submitted_to_manager_date!: string | null;

  @Column({ name: 'manager_verification_date', type: 'date', nullable: true })
  manager_verification_date!: string | null;

  @Column({ name: 'submitted_to_approver_date', type: 'date', nullable: true })
  submitted_to_approver_date!: string | null;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approval_date!: string | null;

  @Column({ name: 'payment_completed_date', type: 'date', nullable: true })
  payment_completed_date!: string | null;

  @CreateDateColumn({ name: 'created_date' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'modified_date' })
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_user_id' })
  applicant!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_user_id' })
  manager!: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'final_approver_user_id' })
  final_approver!: User | null;

  @OneToMany(() => PaymentBreakdownItem, (item) => item.payment_request)
  breakdowns!: PaymentBreakdownItem[];

  @OneToMany(() => ReceiptFile, (file) => file.payment_request)
  receipts!: ReceiptFile[];

  @OneToMany(() => ApprovalLog, (log) => log.payment_request)
  logs!: ApprovalLog[];
}
