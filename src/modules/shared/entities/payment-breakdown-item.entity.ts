import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('payment_breakdown_items')
export class PaymentBreakdownItem {
  @PrimaryGeneratedColumn({ name: 'payment_breakdown_item_id' })
  id!: number;

  @Column({ type: 'int' })
  payment_request_id!: number;

  @Column({ name: 'line_number', type: 'int', default: 1 })
  line_number!: number;

  @Column({ name: 'item_date', type: 'date', nullable: true })
  item_date!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  quantity!: number;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unit_price!: number;

  @CreateDateColumn({ name: 'created_date' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'modified_date' })
  updated_at!: Date;

  @ManyToOne(() => PaymentRequest, (request) => request.breakdowns)
  @JoinColumn({ name: 'payment_request_id' })
  payment_request!: PaymentRequest;
}
