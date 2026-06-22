import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { AuditLogService } from '../shared/services/audit-log.service';
import { WebsocketGateway } from '../shared/websocket.gateway';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { ApprovalActionType, PaymentStatus, RoleCode } from '../shared/types';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * @description Retrieves pending and processed requests assigned to a specific manager, with filters.
   * @param managerId The manager's user ID.
   * @param query The filter and search criteria.
   * @returns A list of payment requests.
   */
  async getPendingRequests(managerId: number, query: QueryRequestsDto) {
    this.logger.log(
      `Fetching requests for manager: ${managerId} with filters: ${JSON.stringify(query)}`,
    );
    const { statusId, date, applicant } = query;

    const qb = this.paymentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('request.managerUserId = :managerId', { managerId })
      .andWhere('request.isDeleted = false');

    if (statusId) {
      qb.andWhere('request.statusId = :statusId', { statusId });
    } else {
      // By default show all manager-relevant statuses
      qb.andWhere('request.statusId IN (:...statuses)', {
        statuses: [
          PaymentStatus.SUBMITTED_MANAGER,
          PaymentStatus.MANAGER_REVIEWING,
          PaymentStatus.MANAGER_VERIFIED,
          PaymentStatus.REJECTED_MANAGER,
        ],
      });
    }

    if (date) {
      qb.andWhere('request.applicationDate = :date', { date });
    }

    if (applicant) {
      qb.andWhere('applicant.fullName ILIKE :applicantName', {
        applicantName: `%${applicant}%`,
      });
    }

    // Default sort: oldest submitted first (highest priority)
    qb.orderBy('request.submittedToManagerDate', 'ASC');

    return qb.getMany();
  }

  /**
   * @description Fetches detailed information of a payment request.
   * Triggers an automatic transition to MANAGER_REVIEWING (3) if currently SUBMITTED_MANAGER (2).
   */
  async getRequestDetails(
    id: number,
    managerId: number,
    ipAddress = '127.0.0.1',
    userAgent = 'system',
  ) {
    this.logger.log(
      `Fetching details for request ID: ${id} by manager: ${managerId}`,
    );

    const request = await this.paymentRequestRepository.findOne({
      where: {
        paymentRequestId: id,
        managerUserId: managerId,
        isDeleted: false,
      },
      relations: [
        'applicant',
        'breakdownItems',
        'receiptFiles',
        'approvalLogs',
        'approvalLogs.actionTakenByUser',
      ],
    });

    if (!request) {
      throw new NotFoundException('指定された申請が見つかりません');
    }

    // Auto-transition status on access
    if (request.statusId === Number(PaymentStatus.SUBMITTED_MANAGER)) {
      this.logger.log(
        `Auto-transitioning request ID: ${id} to MANAGER_REVIEWING`,
      );

      await this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          request.statusId = PaymentStatus.MANAGER_REVIEWING;
          request.modifiedDate = new Date();
          await entityManager.save(request);

          // Record transition log
          await this.auditLogService.createLog(entityManager, {
            paymentRequestId: id,
            actionTakenByUserId: managerId,
            actionTypeId: ApprovalActionType.MGR_REVIEW_START,
            previousStatusId: PaymentStatus.SUBMITTED_MANAGER,
            newStatusId: PaymentStatus.MANAGER_REVIEWING,
            comment: '確認開始',
            ipAddress,
            userAgent,
          });
        },
      );

      // Fetch fresh status and log details to return
      const updatedRequest = await this.paymentRequestRepository.findOne({
        where: { paymentRequestId: id },
        relations: [
          'applicant',
          'breakdownItems',
          'receiptFiles',
          'approvalLogs',
          'approvalLogs.actionTakenByUser',
        ],
      });

      // WebSocket notify
      if (updatedRequest) {
        this.websocketGateway.sendPersonalNotification(
          updatedRequest.applicantUserId,
          'statusUpdate',
          {
            event: 'statusUpdate',
            paymentRequestId: id,
            requestNumber: updatedRequest.requestNumber,
            previousStatusId: PaymentStatus.SUBMITTED_MANAGER,
            newStatusId: PaymentStatus.MANAGER_REVIEWING,
            actionByUserId: managerId,
            timestamp: new Date().toISOString(),
          },
        );

        this.websocketGateway.sendStatusUpdate(RoleCode.MANAGER, {
          event: 'queueChange',
          action: 'REVIEW_START',
          requestId: id,
        });

        return updatedRequest;
      }
    }

    // Sort approval logs chronologically for display
    if (request.approvalLogs) {
      request.approvalLogs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }

    return request;
  }

  /**
   * @description Verifies (approves) a payment request. Transitions to MANAGER_VERIFIED (4) atomically.
   */
  async verifyRequest(
    id: number,
    managerId: number,
    dto: ApproveRequestDto,
    ipAddress: string,
    userAgent: string,
    managerName: string,
  ) {
    this.logger.log(`Verifying request ${id} by manager ${managerId}`);

    return await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        // 1. Fetch and Lock request
        const request = await entityManager.findOne(PaymentRequest, {
          where: {
            paymentRequestId: id,
            managerUserId: managerId,
            isDeleted: false,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!request) {
          throw new NotFoundException('指定された申請が見つかりません');
        }

        // Check current status
        if (
          request.statusId !== Number(PaymentStatus.MANAGER_REVIEWING) &&
          request.statusId !== Number(PaymentStatus.SUBMITTED_MANAGER)
        ) {
          throw new BadRequestException(
            'この申請は現在レビュー中または提出済み状態ではないため、承認できません',
          );
        }

        // 2. Concurrency Check (Optimistic Locking validation)
        const dbTime = new Date(request.modifiedDate).getTime();
        const clientTime = new Date(dto.modifiedDate).getTime();
        if (dbTime !== clientTime) {
          throw new ConflictException({
            errorCode: 'ERR-MGR-409',
            message:
              'この申請は他のユーザーによって更新されました。リストを更新します。',
          });
        }

        const previousStatus = request.statusId;

        // 3. Update status
        request.statusId = PaymentStatus.MANAGER_VERIFIED;
        request.managerVerificationDate = new Date();
        request.modifiedDate = new Date();
        request.currentAssignedToUserId = request.applicantUserId; // Assign back to applicant to submit to final approver
        await entityManager.save(request);

        // 4. Create log
        await this.auditLogService.createLog(entityManager, {
          paymentRequestId: id,
          actionTakenByUserId: managerId,
          actionTypeId: ApprovalActionType.MGR_VERIFIED,
          previousStatusId: previousStatus,
          newStatusId: PaymentStatus.MANAGER_VERIFIED,
          comment: dto.comment || '承認されました。',
          ipAddress,
          userAgent,
        });

        // 5. Trigger WebSockets after successful commit
        this.websocketGateway.sendPersonalNotification(
          request.applicantUserId,
          'statusUpdate',
          {
            event: 'statusUpdate',
            paymentRequestId: id,
            requestNumber: request.requestNumber,
            previousStatusId: previousStatus,
            newStatusId: PaymentStatus.MANAGER_VERIFIED,
            actionByUserId: managerId,
            actionByName: managerName,
            comment: dto.comment || null,
            timestamp: new Date().toISOString(),
          },
        );

        this.websocketGateway.sendStatusUpdate(RoleCode.MANAGER, {
          event: 'queueChange',
          action: 'VERIFIED',
          requestId: id,
        });

        return {
          success: true,
          message: '申請を承認しました。申請者に通知されます。',
        };
      },
    );
  }

  /**
   * @description Rejects a payment request. Transitions to REJECTED_MANAGER (5) atomically.
   */
  async rejectRequest(
    id: number,
    managerId: number,
    dto: RejectRequestDto,
    ipAddress: string,
    userAgent: string,
    managerName: string,
  ) {
    this.logger.log(
      `Rejecting request ${id} by manager ${managerId} with reason: ${dto.comment}`,
    );

    return await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        // 1. Fetch and Lock request
        const request = await entityManager.findOne(PaymentRequest, {
          where: {
            paymentRequestId: id,
            managerUserId: managerId,
            isDeleted: false,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!request) {
          throw new NotFoundException('指定された申請が見つかりません');
        }

        // Check current status
        if (
          request.statusId !== Number(PaymentStatus.MANAGER_REVIEWING) &&
          request.statusId !== Number(PaymentStatus.SUBMITTED_MANAGER)
        ) {
          throw new BadRequestException(
            'この申請は現在レビュー中または提出済み状態ではないため、差し戻しできません',
          );
        }

        // 2. Concurrency Check (Optimistic Locking validation)
        const dbTime = new Date(request.modifiedDate).getTime();
        const clientTime = new Date(dto.modifiedDate).getTime();
        if (dbTime !== clientTime) {
          throw new ConflictException({
            errorCode: 'ERR-MGR-409',
            message:
              'この申請は他のユーザーによって更新されました。リストを更新します。',
          });
        }

        const previousStatus = request.statusId;

        // 3. Update status
        request.statusId = PaymentStatus.REJECTED_MANAGER;
        request.modifiedDate = new Date();
        request.currentAssignedToUserId = request.applicantUserId; // Return to applicant for edits
        await entityManager.save(request);

        // 4. Create log
        await this.auditLogService.createLog(entityManager, {
          paymentRequestId: id,
          actionTakenByUserId: managerId,
          actionTypeId: ApprovalActionType.MGR_REJECTED,
          previousStatusId: previousStatus,
          newStatusId: PaymentStatus.REJECTED_MANAGER,
          comment: dto.comment,
          ipAddress,
          userAgent,
        });

        // 5. Trigger WebSockets after successful commit
        this.websocketGateway.sendPersonalNotification(
          request.applicantUserId,
          'statusUpdate',
          {
            event: 'statusUpdate',
            paymentRequestId: id,
            requestNumber: request.requestNumber,
            previousStatusId: previousStatus,
            newStatusId: PaymentStatus.REJECTED_MANAGER,
            actionByUserId: managerId,
            actionByName: managerName,
            comment: dto.comment,
            timestamp: new Date().toISOString(),
          },
        );

        this.websocketGateway.sendStatusUpdate(RoleCode.MANAGER, {
          event: 'queueChange',
          action: 'REJECTED',
          requestId: id,
        });

        return {
          success: true,
          message: '申請を差し戻しました。申請者に通知されます。',
        };
      },
    );
  }
}
