import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { PaymentRequest } from '../modules/shared/entities/payment-request.entity';
import { User } from '../modules/shared/entities/user.entity';
import {
  PaymentStatus,
  Currency,
  PaymentType,
  PaymentMethod,
  UserRole,
} from '../modules/shared/types';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const logger = new Logger('Seeder');
  logger.log('Starting DB Seeder for Users and Payment Requests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const prRepo = dataSource.getRepository(PaymentRequest);

  // --- 1. GENERATE USERS ---
  logger.log('Generating Users with common password "password123"...');
  const commonPassword = 'password123';
  const passwordHash = await bcrypt.hash(commonPassword, 10);

  const newUsers: Partial<User>[] = [];
  const generateUsers = (count: number, roleId: number, roleName: string) => {
    for (let i = 1; i <= count; i++) {
      const uniqueId = Math.floor(Math.random() * 90000) + 10000;
      newUsers.push({
        // UNIQUE PREFIX "seed_" to easily identify and delete later
        email: `seed_${roleName.toLowerCase()}${uniqueId}@example.com`,
        passwordHash,
        fullName: `Seed ${roleName} User ${uniqueId}`,
        employeeNumber: `SEED_${roleName.substring(0, 3).toUpperCase()}${uniqueId}`,
        department: 'General Dept',
        branch: Math.random() > 0.5 ? 'Yangon' : 'Mandalay',
        roleId,
        isActive: true,
      });
    }
  };

  generateUsers(20, UserRole.APPLICANT, 'Applicant');
  generateUsers(5, UserRole.MANAGER, 'Manager');
  generateUsers(5, UserRole.APPROVER, 'Approver');
  generateUsers(5, UserRole.ACCOUNTING, 'Accounting');
  generateUsers(2, UserRole.ADMIN, 'Admin');

  await userRepo.save(newUsers);
  logger.log(`✅ Successfully seeded ${newUsers.length} Users!`);

  // --- 2. FETCH SEEDED USERS FOR RELATIONSHIPS ---
  // We only fetch seeded users to avoid mixing with existing real users
  const applicants = newUsers.filter((u) => u.roleId === UserRole.APPLICANT);
  const managers = newUsers.filter((u) => u.roleId === UserRole.MANAGER);
  const approvers = newUsers.filter((u) => u.roleId === UserRole.APPROVER);
  const accountings = newUsers.filter((u) => u.roleId === UserRole.ACCOUNTING);

  // --- 3. GENERATE PAYMENT REQUESTS ---
  const statuses = Object.values(PaymentStatus).filter(
    (v) => typeof v === 'number',
  ) as PaymentStatus[];
  const sampleData: Partial<PaymentRequest>[] = [];

  logger.log('Generating 150 random Payment Requests covering all statuses...');

  for (let i = 0; i < 150; i++) {
    const applicant = applicants[Math.floor(Math.random() * applicants.length)];
    const manager = managers[Math.floor(Math.random() * managers.length)];
    const approver = approvers[Math.floor(Math.random() * approvers.length)];
    const accounting =
      accountings[Math.floor(Math.random() * accountings.length)];
    const statusId = statuses[Math.floor(Math.random() * statuses.length)];

    let currentAssigned: number | null = applicant.userId!;
    if (
      statusId === PaymentStatus.SUBMITTED_MANAGER ||
      statusId === PaymentStatus.MANAGER_REVIEWING
    ) {
      currentAssigned = manager.userId!;
    } else if (
      statusId === PaymentStatus.MANAGER_VERIFIED ||
      statusId === PaymentStatus.SUBMITTED_APPROVER ||
      statusId === PaymentStatus.APPROVER_REVIEWING
    ) {
      currentAssigned = approver.userId!;
    } else if (statusId === PaymentStatus.APPROVED) {
      currentAssigned = accounting.userId!;
    } else if (
      statusId === PaymentStatus.PAID ||
      statusId === PaymentStatus.REJECTED_APPROVER ||
      statusId === PaymentStatus.REJECTED_MANAGER
    ) {
      currentAssigned = null;
    } else if (statusId === PaymentStatus.DRAFT) {
      currentAssigned = applicant.userId!;
    }

    const uniqueNum = Math.floor(Math.random() * 900000) + 100000;
    // UNIQUE PREFIX "SEED-" to easily identify and delete later
    const requestNumber = `SEED-PRF-2026-${uniqueNum}`;

    sampleData.push({
      requestNumber,
      applicantUserId: applicant.userId,
      managerUserId: manager.userId,
      finalApproverUserId: approver.userId,
      accountingUserId: accounting.userId,
      currentAssignedToUserId: currentAssigned,
      statusId: statusId,
      totalAmount: (Math.floor(Math.random() * 50000) + 1000).toFixed(2),
      currencyId: Math.random() > 0.5 ? Currency.MMK : Currency.USD,
      applicationDate: new Date().toISOString().split('T')[0],
      purpose: `Seed Data Generator Purpose ${i + 1}`,
      desiredPaymentDate: new Date(
        Date.now() + 86400000 * (Math.floor(Math.random() * 10) + 1),
      )
        .toISOString()
        .split('T')[0],
      paymentMethodId: PaymentMethod.BANK_TRANSFER,
      paymentTypeId: PaymentType.EXPENSE_REIMBURSE,
      bankAccountInfo: 'KBZ Bank, 1234567890123',
      requestContent: `This is an automated request for testing generated by the full seeder script. Item #${i + 1}`,
      hasReceipt: false,
      isDeleted: false,
    });
  }

  try {
    await prRepo.save(sampleData);
    logger.log(`✅ Successfully seeded ${sampleData.length} Payment Requests!`);
  } catch (error) {
    logger.error('Failed to save payment requests:', error);
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Unhandled error during seeding:', err);
});
