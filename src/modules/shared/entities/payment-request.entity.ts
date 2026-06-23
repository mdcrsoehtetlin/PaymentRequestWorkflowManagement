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
  id!: number;

  @Column({ name: 'request_number', unique: true, type: 'varchar', length: 50 })
  requestNumber!: string;

  @Column({ name: 'applicant_user_id', type: 'int' })
  applicant_user_id!: number;

  @Column({ name: 'manager_user_id', type: 'int', nullable: true })
  manager_user_id!: number | null;

  @Column({ name: 'final_approver_user_id', type: 'int', nullable: true })
  final_approver_user_id!: number | null;

  @Column({ name: 'accounting_user_id', type: 'int', nullable: true })
  accounting_user_id!: number | null;

  @Column({ name: 'current_assigned_to_user_id', type: 'int', nullable: true })
  current_assigned_to_user_id!: number | null;
  @Column({ type: 'int' })
  status_id!: number;

  @Column({ name: 'final_approver_user_id', type: 'int', nullable: true })
  finalApproverUserId!: number | null;

  @Column({ name: 'accounting_user_id', type: 'int', nullable: true })
  accountingUserId!: number | null;

  @Column({ name: 'status_id', type: 'int' })
  statusId!: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ name: 'currency_id', type: 'int' })
  currencyId!: number;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate!: string;

  @Column({ type: 'varchar', length: 500 })
  purpose!: string;

  @Column({ name: 'desired_payment_date', type: 'date', nullable: true })
  desiredPaymentDate!: string;

  @Column({ name: 'payment_method_id', type: 'int', nullable: true })
  paymentMethodId!: number;

  @Column({ name: 'payment_type_id', type: 'int', nullable: true })
  paymentTypeId!: number;

  @Column({
    name: 'bank_account_info',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  bank_account_info!: string | null;

  @Column({ type: 'text' })
  request_content!: string;
  @Column({ type: 'boolean', default: false })
  has_receipt!: boolean;

  @Column({
    name: 'submitted_to_manager_date',
    type: 'timestamptz',
    nullable: true,
  })
  submitted_to_manager_date!: Date | null;

  @Column({
    name: 'manager_verification_date',
    type: 'timestamptz',
    nullable: true,
  })
  manager_verification_date!: Date | null;

  @Column({
    name: 'submitted_to_approver_date',
    type: 'timestamptz',
    nullable: true,
  })
  submitted_to_approver_date!: Date | null;

  @Column({ name: 'approval_date', type: 'timestamptz', nullable: true })
  approval_date!: Date | null;

  @Column({
    name: 'payment_completed_date',
    type: 'timestamptz',
    nullable: true,
  })
  payment_completed_date!: Date | null;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;
  @CreateDateColumn({ name: 'created_date' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'modified_date' })
  updated_at!: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'final_approver_user_id' })
  final_approver!: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_user_id' })
  applicant!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_user_id' })
  manager!: User | null;
  @OneToMany(() => PaymentBreakdownItem, (item) => item.paymentRequest)
  breakdowns!: PaymentBreakdownItem[];

  @OneToMany(() => ReceiptFile, (file) => file.paymentRequest)
  receipts!: ReceiptFile[];

  @Column({ name: 'bank_account_info', length: 200, nullable: true })
  bankAccountInfo!: string;

  @Column({ name: 'request_content', type: 'text' })
  requestContent!: string;

  @Column({ name: 'has_receipt', default: true })
  hasReceipt!: boolean;

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

  @Column({ name: 'current_assigned_to_user_id', type: 'int', nullable: true })
  currentAssignedToUserId!: number | null;

  @OneToMany('PaymentBreakdownItem', 'paymentRequest', {
    cascade: true,
  })
  breakdownItems!: PaymentBreakdownItem[];

  @OneToMany('ApprovalLog', 'paymentRequest')
  approvalLogs!: ApprovalLog[];

  @OneToMany('ReceiptFile', 'paymentRequest')
  receiptFiles!: ReceiptFile[];
}
