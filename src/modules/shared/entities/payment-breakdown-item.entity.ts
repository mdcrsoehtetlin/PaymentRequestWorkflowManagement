import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
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
  lineNumber!: number;

  @Column({ name: 'item_date', type: 'date', nullable: true })
  itemDate!: string;

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
  modifiedDate!: Date;

  @ManyToOne('PaymentRequest', 'breakdownItems')
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;
}
