import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

/**
 * @description Immutable audit log entity tracking all workflow state transitions.
 * Database trigger `protect_approval_logs_immutable` must be active to prevent
 * UPDATE/DELETE operations on this table, ensuring audit trail integrity.
 */
@Entity('approval_logs')
export class ApprovalLog {
  @PrimaryGeneratedColumn({ name: 'approval_log_id', type: 'bigint' })
  approvalLogId!: string;

  @Column({ name: 'payment_request_id', type: 'int' })
  paymentRequestId!: number;

  @Column({ name: 'action_taken_by_user_id', type: 'int' })
  actionTakenByUserId!: number;

  @Column({ name: 'action_type_id', type: 'int' })
  actionTypeId!: number;

  @Column({ name: 'previous_status_id', type: 'int', nullable: true })
  previousStatusId!: number;

  @Column({ name: 'new_status_id', type: 'int' })
  newStatusId!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255 })
  userAgent!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;

  @ManyToOne('PaymentRequest', 'approvalLogs')
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;
}
