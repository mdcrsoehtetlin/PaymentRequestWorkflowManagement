import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApprovalLog } from '../entities/approval-log.entity';
import { ApprovalActionType } from '../types';

/**
 * Payload required to create a new approval log entry.
 * All fields are mandatory — logs are immutable audit records.
 */
export interface CreateApprovalLogDto {
  paymentRequestId: number;
  actionTakenByUserId: number;
  actionTypeId: ApprovalActionType;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
}

/**
 * @description Shared service for creating immutable approval log entries.
 * MUST be called inside a database transaction (receives EntityManager).
 * Every workflow state transition across ALL modules MUST use this service.
 *
 * @example
 * // In a service method wrapped in dataSource.transaction():
 * await this.auditLogService.createLog(manager, {
 *   paymentRequestId: id,
 *   actionTakenByUserId: userId,
 *   actionTypeId: ApprovalActionType.SUBMITTED,
 *   previousStatusId: PaymentStatus.DRAFT,
 *   newStatusId: PaymentStatus.SUBMITTED_MANAGER,
 *   comment: null,
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'] ?? '',
 * });
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * @description Creates an immutable approval log entry within an active transaction.
   *
   * @param manager - TypeORM EntityManager from an active transaction
   * @param dto - All required fields for the log entry
   * @returns The saved ApprovalLog entity
   * @throws InternalServerErrorException if the save operation fails
   */
  async createLog(
    manager: EntityManager,
    dto: CreateApprovalLogDto,
  ): Promise<ApprovalLog> {
    const log = manager.create(ApprovalLog, {
      paymentRequestId: dto.paymentRequestId,
      actionTakenByUserId: dto.actionTakenByUserId,
      actionTypeId: dto.actionTypeId,
      previousStatusId: dto.previousStatusId ?? undefined,
      newStatusId: dto.newStatusId ?? undefined,
      comment: dto.comment ?? undefined,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    const saved = await manager.save(ApprovalLog, log);
    this.logger.log(
      `Audit log created: requestId=${dto.paymentRequestId} ` +
        `action=${ApprovalActionType[dto.actionTypeId]} ` +
        `by userId=${dto.actionTakenByUserId}`,
    );
    return saved;
  }
}
