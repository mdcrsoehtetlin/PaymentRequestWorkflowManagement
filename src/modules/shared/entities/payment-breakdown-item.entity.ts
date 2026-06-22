import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('payment_breakdown_items')
export class PaymentBreakdownItem {
  @PrimaryGeneratedColumn({ name: 'payment_breakdown_item_id' })
  paymentBreakdownItemId!: number;

  @Column({ name: 'payment_request_id' })
  paymentRequestId!: number;

  @ManyToOne(() => PaymentRequest, (request) => request.breakdownItems, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;

  @Column({ name: 'line_number' })
  lineNumber!: number;

  @Column({ name: 'item_date', type: 'date' })
  itemDate!: Date | string;

  @Column({ length: 200 })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string; // Map to string in NestJS to prevent precision loss

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: '1.00',
    nullable: true,
  })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 10, scale: 2, nullable: true })
  unitPrice!: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamp with time zone' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'modified_date', type: 'timestamp with time zone' })
  modifiedDate!: Date;
}
