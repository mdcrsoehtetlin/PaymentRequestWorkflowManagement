import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from './user.entity';

/**
 * @description Immutable audit log entity tracking all workflow state transitions.
 * Database trigger `protect_approval_logs_immutable` must be active to prevent
 * UPDATE/DELETE operations on this table, ensuring audit trail integrity.
 */
@Entity('approval_logs')
export class ApprovalLog {
  @PrimaryGeneratedColumn({ name: 'approval_log_id', type: 'bigint' })
  approvalLogId!: string;

  @Column({ type: 'int' })
  payment_request_id!: number;

  @Column({ type: 'int', nullable: true })
  action_taken_by_user_id!: number;

  @Column({ type: 'int', nullable: true })
  action_type_id!: number;

  @Column({ name: 'previous_status_id', type: 'int', nullable: true })
  previousStatusId!: number;

  @Column({ type: 'int', nullable: true })
  new_status_id!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;

  @ManyToOne('PaymentRequest', 'approvalLogs')
  @JoinColumn({ name: 'payment_request_id' })
  payment_request!: PaymentRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'action_taken_by_user_id' })
  action_taken_by_user!: User;
}
