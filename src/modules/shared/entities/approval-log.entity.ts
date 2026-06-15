import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from './user.entity';

@Entity('approval_logs')
export class ApprovalLog {
  @PrimaryGeneratedColumn({ name: 'approval_log_id', type: 'bigint' })
  approvalLogId: string; // BIGINT is returned as string in Node.js pg

  @Column({ name: 'payment_request_id' })
  paymentRequestId: number;

  @ManyToOne(() => PaymentRequest, (request) => request.approvalLogs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest: PaymentRequest;

  @Column({ name: 'action_taken_by_user_id' })
  actionTakenByUserId: number;

  @ManyToOne(() => User, (user) => user.approvalLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'action_taken_by_user_id' })
  actionTakenByUser: User;

  @Column({ name: 'action_type_id' })
  actionTypeId: number;

  @Column({ name: 'previous_status_id', nullable: true })
  previousStatusId: number;

  @Column({ name: 'new_status_id', nullable: true })
  newStatusId: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'ip_address', length: 50 })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 500 })
  userAgent: string;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamp with time zone' })
  timestamp: Date;
}
