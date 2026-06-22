import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { PaymentBreakdownItem } from './payment-breakdown-item.entity';
import { ApprovalLog } from './approval-log.entity';
import { ReceiptFile } from './receipt-file.entity';

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn({ name: 'payment_request_id' })
  paymentRequestId!: number;

  @Column({ name: 'request_number', unique: true, length: 50 })
  requestNumber!: string;

  @Column({ name: 'applicant_user_id' })
  applicantUserId!: number;

  @ManyToOne(() => User, (user) => user.paymentRequestsAsApplicant, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'applicant_user_id' })
  applicant!: User;

  @Column({ name: 'manager_user_id', nullable: true })
  managerUserId!: number;

  @ManyToOne(() => User, (user) => user.paymentRequestsAsManager, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'manager_user_id' })
  manager!: User;

  @Column({ name: 'final_approver_user_id', nullable: true })
  finalApproverUserId!: number;

  @ManyToOne(() => User, (user) => user.paymentRequestsAsApprover, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'final_approver_user_id' })
  finalApprover!: User;

  @Column({ name: 'accounting_user_id', nullable: true })
  accountingUserId!: number;

  @ManyToOne(() => User, (user) => user.paymentRequestsAsAccounting, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'accounting_user_id' })
  accounting!: User;

  @Column({ name: 'current_assigned_to_user_id', nullable: true })
  currentAssignedToUserId!: number;

  @ManyToOne(() => User, (user) => user.assignedPaymentRequests, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'current_assigned_to_user_id' })
  currentAssignedTo!: User;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate!: Date | string;

  @Column({ name: 'desired_payment_date', type: 'date' })
  desiredPaymentDate!: Date | string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string; // Map to string in NestJS to prevent precision loss

  @Column({ name: 'currency_id' })
  currencyId!: number;

  @Column({ name: 'payment_type_id' })
  paymentTypeId!: number;

  @Column({ name: 'payment_method_id' })
  paymentMethodId!: number;

  @Column({ length: 500 })
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
