import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../shared/entities/user.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

const BCRYPT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 8;

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
   * @description Generates a cryptographically secure random temporary password.
   * @returns An 8-character alphanumeric temporary password.
   */
  private generateTemporaryPassword(): string {
    const bytes = randomBytes(TEMP_PASSWORD_LENGTH);
    return bytes
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, TEMP_PASSWORD_LENGTH);
  }

  /**
   * @description Hashes a password using bcrypt with 12 salt rounds.
   * @param plainPassword The plain text password to hash.
   * @returns The bcrypt hashed password.
   */
  private async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  }

  /**
   * @description Creates a new user with auto-generated temporary password.
   * @param dto The user creation payload.
   * @returns The created user with temporary password displayed once.
   * @throws {ConflictException} If email or employee number already exists.
   */
  async createUser(dto: CreateUserDto) {
    this.logger.log(`Creating new user with email: ${dto.email}`);

    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException(
        'このメールアドレスは既に登録されています',
      );
    }

    const existingEmpNo = await this.userRepository.findOne({
      where: { employeeNumber: dto.employeeNumber },
    });
    if (existingEmpNo) {
      throw new ConflictException(
        'この社員番号は既に登録されています',
      );
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await this.hashPassword(temporaryPassword);

    const user = this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      employeeNumber: dto.employeeNumber,
      department: dto.department,
      branch: dto.branch,
      roleId: dto.roleId,
      isActive: dto.isActive ?? true,
      passwordHash,
    });

    const saved = await this.userRepository.save(user);

    this.logger.log(
      `User created: userId=${saved.userId} email=${saved.email}`,
    );

    return {
      userId: saved.userId,
      employeeNumber: saved.employeeNumber,
      fullName: saved.fullName,
      email: saved.email,
      branch: saved.branch,
      roleId: saved.roleId,
      isActive: saved.isActive,
      temporaryPassword,
      version: saved.version,
    };
  }

  /**
   * @description Fetches a paginated list of system users.
   * @param keyword Search filter for employee number or full name.
   * @param roleId Filter by role ID.
   * @param isActive Filter by active status.
   * @param page Page number (default 1).
   * @param pageSize Items per page (default 20).
   * @returns Paginated user list.
   */
  async getUsers(
    keyword?: string,
    roleId?: number,
    isActive?: boolean,
    page = 1,
    pageSize = 20,
  ) {
    this.logger.log(`Fetching users: page=${page} pageSize=${pageSize}`);

    const qb = this.userRepository.createQueryBuilder('user');

    if (keyword) {
      qb.andWhere(
        '(user.employee_number ILIKE :keyword OR user.full_name ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (roleId !== undefined) {
      qb.andWhere('user.role_id = :roleId', { roleId });
    }
    if (isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', { isActive });
    }

    const totalItems = await qb.getCount();
    const data = await qb
      .orderBy('user.employee_number', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      data: data.map((u) => ({
        userId: u.userId,
        employeeNumber: u.employeeNumber,
        fullName: u.fullName,
        email: u.email,
        branch: u.branch,
        roleId: u.roleId,
        isActive: u.isActive,
        version: u.version,
      })),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  /**
   * @description Updates user details with optimistic locking validation.
   * @param id The user ID to update.
   * @param dto The update payload including version for optimistic lock.
   * @returns The updated user object.
   * @throws {NotFoundException} If user not found.
   * @throws {ConflictException} If version mismatch (concurrent edit).
   */
  async updateUser(id: number, dto: UpdateUserDto) {
    this.logger.log(`Updating user ${id}`);

    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        fullName: dto.fullName ?? user.fullName,
        department: dto.department ?? user.department,
        branch: dto.branch ?? user.branch,
        roleId: dto.roleId ?? user.roleId,
        isActive: dto.isActive ?? user.isActive,
        version: () => 'version + 1',
      })
      .where('userId = :id AND version = :version', {
        id,
        version: dto.version,
      })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        'このレコードは他のユーザーによって変更されました。更新してやり直してください。',
      );
    }

    const updated = await this.userRepository.findOne({
      where: { userId: id },
    });

    this.logger.log(`User ${id} updated successfully`);

    return {
      userId: updated!.userId,
      employeeNumber: updated!.employeeNumber,
      fullName: updated!.fullName,
      email: updated!.email,
      branch: updated!.branch,
      roleId: updated!.roleId,
      isActive: updated!.isActive,
      version: updated!.version,
    };
  }

  /**
   * @description Toggles user active status and evicts active sessions from Redis.
   * @param id The user ID to toggle.
   * @param isActive The new active status.
   * @param currentUserId The ID of the admin performing the action (prevents self-lockout).
   * @returns Success status.
   * @throws {NotFoundException} If user not found.
   * @throws {BadRequestException} If admin tries to deactivate themselves.
   */
  async toggleUserActive(
    id: number,
    isActive: boolean,
    currentUserId: number,
  ) {
    this.logger.log(
      `Toggling user ${id} active state to ${isActive}`,
    );

    if (id === currentUserId && !isActive) {
      throw new BadRequestException(
        '自分のアカウトを無効にすることはできません',
      );
    }

    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    await this.userRepository.update(id, { isActive });

    if (!isActive) {
      await this.evictUserSessions(id);
    }

    this.logger.log(
      `User ${id} active state toggled to ${isActive}`,
    );

    return { success: true, isActive };
  }

  /**
   * @description Evicts all active session keys for a user from Redis.
   * @param userId The user ID whose sessions should be evicted.
   */
  private async evictUserSessions(userId: number): Promise<void> {
    this.logger.log(`Evicting sessions for user ${userId}`);

    try {
      const { createClient } = await import('redis');
      const client = createClient({
        url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
      });
      await client.connect();

      const keys = await client.keys(`session:*`);
      let evictedCount = 0;

      for (const key of keys) {
        const sessionData = await client.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId === userId || parsed.sub === userId) {
            await client.del(key);
            evictedCount++;
          }
        }
      }

      await client.disconnect();
      this.logger.log(
        `Evicted ${evictedCount} sessions for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to evict sessions for user ${userId}`,
        error,
      );
    }
  }

  /**
   * @description Generates a new temporary password for a user.
   * @param id The user ID to reset password for.
   * @param dto Contains version for optimistic locking.
   * @returns The new temporary password (displayed once).
   * @throws {NotFoundException} If user not found.
   * @throws {ConflictException} If version mismatch.
   */
  async resetPassword(id: number, dto: ResetPasswordDto) {
    this.logger.log(`Resetting password for user ${id}`);

    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await this.hashPassword(temporaryPassword);

    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        passwordHash,
        version: () => 'version + 1',
      })
      .where('userId = :id AND version = :version', {
        id,
        version: dto.version,
      })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        'このレコードは他のユーザーによって変更されました。更新してやり直してください。',
      );
    }

    await this.evictUserSessions(id);

    const updated = await this.userRepository.findOne({
      where: { userId: id },
    });

    this.logger.log(`Password reset for user ${id}`);

    return {
      userId: id,
      temporaryPassword,
      version: updated!.version,
    };
  }

  /**
   * @description Fetches master data lookup tables.
   * @param category The master data category to fetch.
   * @returns Read-only list of configured categories.
   */
  async getMasterData(category: string) {
    this.logger.log(`Fetching master data: ${category}`);

    const tableMap: Record<string, { table: string; idColumn: string; hasIsActive: boolean }> = {
      currencies: { table: 'currencies', idColumn: 'currency_id', hasIsActive: true },
      roles: { table: 'user_roles', idColumn: 'role_id', hasIsActive: true },
      statuses: { table: 'payment_statuses', idColumn: 'status_id', hasIsActive: false },
      'payment-types': { table: 'payment_types', idColumn: 'payment_type_id', hasIsActive: true },
      'payment-methods': { table: 'payment_methods', idColumn: 'payment_method_id', hasIsActive: true },
    };

    const mapping = tableMap[category];
    if (!mapping) {
      throw new NotFoundException('カテゴリが見つかりません');
    }

    const query = this.userRepository.manager.connection;
    const whereClause = '';

    const results = await query.query(
      `SELECT * FROM ${mapping.table} ${whereClause} ORDER BY ${mapping.idColumn} ASC`,
    );

    return results;
  }

  /**
   * @description Fetches global audit logs with date range and user filters.
   * @param startDate Optional start date filter (YYYY-MM-DD).
   * @param endDate Optional end date filter (YYYY-MM-DD).
   * @param userId Optional user ID filter.
   * @param page Page number (default 1).
   * @param pageSize Items per page (default 50).
   * @returns Paginated audit log list.
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const { startDate, endDate, actionTypeId, requestId, actorName } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    this.logger.log(
      `Fetching audit logs: startDate=${startDate} endDate=${endDate} actionTypeId=${actionTypeId} page=${page}`,
    );

    const qb = this.approvalLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actionTakenByUser', 'user')
      .leftJoinAndSelect('log.paymentRequest', 'request');

    if (startDate) {
      qb.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.timestamp <= :endDate', { endDate });
    }
    if (actionTypeId) {
      qb.andWhere('log.actionTypeId = :actionTypeId', { actionTypeId });
    }
    if (requestId) {
      qb.andWhere('log.paymentRequestId = :requestId', { requestId });
    }
    if (actorName) {
      qb.andWhere('user.fullName ILike :actorName', {
        actorName: `%${actorName}%`,
      });
    }

    const totalItems = await qb.getCount();
    const data = await qb
      .orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      data: data.map((log) => ({
        approvalLogId: log.approvalLogId,
        paymentRequestId: log.paymentRequestId,
        actionTakenByUserId: log.actionTakenByUserId,
        actorName: log.actionTakenByUser?.fullName ?? 'Unknown',
        actionTypeId: log.actionTypeId,
        previousStatusId: log.previousStatusId,
        newStatusId: log.newStatusId,
        comment: log.comment,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
      })),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }
}
