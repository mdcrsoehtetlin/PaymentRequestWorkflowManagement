import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ApprovalLog)
    private readonly approvalLogRepository: Repository<ApprovalLog>,
  ) {}

  /**
   * @description Creates a new user in the system.
   * @param userData The payload containing user details.
   * @returns The created user entity.
   * @throws {Error} If user creation fails.
   */
  async createUser(userData: CreateUserDto) {
    this.logger.log(`Creating new user with email: ${userData.email}`);
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  /**
   * @description Toggles the active state of a user.
   * @param id The ID of the user.
   * @param isActive The new active status.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  async toggleUserActive(id: number, isActive: boolean) {
    this.logger.log(`Toggling user ${id} active state to ${isActive}`);
    await this.userRepository.update(id, { isActive });
    return { success: true, isActive };
  }

  /**
   * @description Retrieves system audit logs with optional filters.
   * @param startDate Optional start date filter.
   * @param endDate Optional end date filter.
   * @param userId Optional user ID filter.
   * @returns A list of audit logs.
   * @throws {Error} If retrieval fails.
   */
  async getAuditLogs(startDate?: string, endDate?: string, userId?: number) {
    this.logger.log(
      `Fetching system audit logs from ${startDate} to ${endDate}`,
    );
    const query = this.approvalLogRepository
      .createQueryBuilder('log')
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
