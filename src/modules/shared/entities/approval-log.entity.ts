import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('approval_logs')
export class ApprovalLog {
  @PrimaryGeneratedColumn({ name: 'approval_log_id', type: 'bigint' })
  id!: string;

  @Column({ type: 'int' })
  payment_request_id!: string;

  @Column({ type: 'int' })
  action_taken_by_user_id!: string;

  @Column({ type: 'int' })
  action_type_id!: number;

  @Column({ type: 'int', nullable: true })
  previous_status_id!: number;

  @Column({ type: 'int' })
  new_status_id!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address!: string;

  @Column({ type: 'varchar', length: 255 })
  user_agent!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;

  @ManyToOne(() => PaymentRequest, (request) => request.logs)
  @JoinColumn({ name: 'payment_request_id' })
  payment_request!: PaymentRequest;
}
