import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { ApprovalLog } from './approval-log.entity';
import { ReceiptFile } from './receipt-file.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId!: number;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 512 })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 200 })
  fullName!: string;

  @Column({ name: 'employee_number', unique: true, length: 20 })
  employeeNumber!: string;

  @Column({ nullable: true, length: 100 })
  department!: string;

  @Column({ length: 100 })
  branch!: string;

  @Column({ name: 'role_id' })
  roleId!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;


  @CreateDateColumn({ name: 'created_date', type: 'timestamp with time zone' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'modified_date', type: 'timestamp with time zone' })
  modifiedDate!: Date;

  @Column({
    name: 'last_login_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastLoginDate!: Date;
}
