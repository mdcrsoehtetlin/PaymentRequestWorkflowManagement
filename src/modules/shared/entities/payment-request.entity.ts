import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
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
  payment_type_id!: number;

  @Column({ type: 'int' })
  payment_method_id!: number;

  @Column({ type: 'varchar', length: 500 })
  purpose!: string;

  @Column({ name: 'bank_account_info', length: 200, nullable: true })
  bankAccountInfo!: string;

  @Column({ name: 'request_content', type: 'text' })
  requestContent!: string;

  @Column({ name: 'has_receipt', default: true })
  hasReceipt!: boolean;

  @Column({ name: 'status_id' })
  statusId!: number;

  @Column({
    name: 'submitted_to_manager_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  submittedToManagerDate!: Date;

  @Column({
    name: 'manager_verification_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  managerVerificationDate!: Date;

  @Column({
    name: 'submitted_to_approver_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  submittedToApproverDate!: Date;

  @Column({
    name: 'approval_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  approvalDate!: Date;

  @Column({
    name: 'payment_completed_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  paymentCompletedDate!: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamp with time zone' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'modified_date', type: 'timestamp with time zone' })
  modifiedDate!: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @OneToMany(() => PaymentBreakdownItem, (item) => item.paymentRequest, {
    cascade: true,
  })
  breakdownItems!: PaymentBreakdownItem[];

  @OneToMany(() => ApprovalLog, (log) => log.paymentRequest)
  approvalLogs!: ApprovalLog[];

  @OneToMany(() => ReceiptFile, (file) => file.paymentRequest)
  receiptFiles!: ReceiptFile[];
}
