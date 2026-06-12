import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ApprovalLog)
    private readonly approvalLogRepository: Repository<ApprovalLog>,
  ) {}

  async createUser(userData: any) {
    this.logger.log(`Creating new user with email: ${userData.email}`);
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async toggleUserActive(id: number, isActive: boolean) {
    this.logger.log(`Toggling user ${id} active state to ${isActive}`);
    await this.userRepository.update(id, { isActive });
    return { success: true, isActive };
  }

  async getAuditLogs(startDate?: string, endDate?: string, userId?: number) {
    this.logger.log(`Fetching system audit logs from ${startDate} to ${endDate}`);
    const query = this.approvalLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.paymentRequest', 'request')
      .leftJoinAndSelect('log.actionTakenByUser', 'user');

    if (startDate) {
      query.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('log.timestamp <= :endDate', { endDate });
    }
    if (userId) {
      query.andWhere('log.actionTakenByUserId = :userId', { userId });
    }

    return query.orderBy('log.timestamp', 'DESC').getMany();
  }
}
