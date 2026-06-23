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
  paymentRequestId!: number;

  @Column({ name: 'request_number', unique: true, type: 'varchar', length: 50 })
  requestNumber!: string;

  @Column({ name: 'applicant_user_id', type: 'int' })
  applicantUserId!: number;

  @Column({ name: 'manager_user_id', type: 'int', nullable: true })
  managerUserId!: number | null;

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

  @Column({ name: 'desired_payment_date', type: 'date' })
  desiredPaymentDate!: string;

  @Column({ name: 'payment_type_id', type: 'int' })
  paymentTypeId!: number;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId!: number;

  @Column({ type: 'varchar', length: 500 })
  purpose!: string;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_user_id' })
  applicant!: User;

  @OneToMany('PaymentBreakdownItem', 'paymentRequest', {
    cascade: true,
  })
  breakdownItems!: PaymentBreakdownItem[];

  @OneToMany('ApprovalLog', 'paymentRequest')
  approvalLogs!: ApprovalLog[];

  @OneToMany('ReceiptFile', 'paymentRequest')
  receiptFiles!: ReceiptFile[];
}
