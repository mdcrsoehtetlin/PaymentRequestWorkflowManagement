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
import { StartReviewDto } from './dto/start-review.dto';
import {
  ApprovalActionType,
  PaymentStatus,
  RoleCode,
  UserRole,
} from '../shared/types';
import { User } from '../shared/entities/user.entity';

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

  private omitCircularRefs(
    obj: Record<string, unknown>,
    keys: string[],
  ): Record<string, unknown> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  private serializeRequest(request: PaymentRequest) {
    const { breakdowns, receipts, approvalLogs, ...rest } = request;
    return {
      ...rest,
      paymentRequestId: request.id,
      breakdownItems: (breakdowns ?? []).map((item) =>
        this.omitCircularRefs(item as unknown as Record<string, unknown>, [
          'paymentRequest',
        ]),
      ),
      receiptFiles: (receipts ?? []).map((file) =>
        this.omitCircularRefs(file as unknown as Record<string, unknown>, [
          'paymentRequest',
        ]),
      ),
      approvalLogs: (approvalLogs ?? []).map((log) => ({
        ...this.omitCircularRefs(log as any, [
          'payment_request',
          'action_taken_by_user',
        ]),
        actionTakenByUser: log.action_taken_by_user
          ? {
              userId: log.action_taken_by_user.userId,
              fullName: log.action_taken_by_user.fullName,
              employeeNumber: log.action_taken_by_user.employeeNumber,
              branch: log.action_taken_by_user.branch,
            }
          : null,
      })),
    };
  }

  async getPendingRequests(managerId: number, query: QueryRequestsDto) {
    this.logger.log(
      `Fetching requests for manager: ${managerId} with filters: ${JSON.stringify(query)}`,
    );
    const { statusId, dateFrom, dateTo, applicant } = query;

    const qb = this.paymentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('request.managerUserId = :managerId', { managerId })
      .andWhere('request.isDeleted = false');

    if (statusId) {
      qb.andWhere('request.statusId = :statusId', { statusId });
    }

    if (dateFrom) {
      qb.andWhere('request.applicationDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('request.applicationDate <= :dateTo', { dateTo });
    }

    if (applicant) {
      qb.andWhere('applicant.fullName ILIKE :applicantName', {
        applicantName: `%${applicant}%`,
      });
    }

    qb.orderBy('request.submittedToManagerDate', 'ASC');

    const requests = await qb.getMany();
    return requests.map((r) => ({
      ...r,
      paymentRequestId: r.id,
    }));
  }

  async getRequestDetails(id: number, managerId: number) {
    this.logger.log(
      `Fetching details for request ID: ${id} by manager: ${managerId}`,
    );

    const request = await this.paymentRequestRepository.findOne({
      where: {
        id: id,
        managerUserId: managerId,
        isDeleted: false,
      },
      relations: [
        'applicant',
        'breakdowns',
        'receipts',
        'approvalLogs',
        'approvalLogs.action_taken_by_user',
      ],
    });

    if (!request) {
      throw new NotFoundException('指定された申請が見つかりません');
    }

    if (request.approvalLogs) {
      request.approvalLogs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }

    return this.serializeRequest(request);
  }

  /**
   * @description Transitions a request from SUBMITTED_MANAGER to MANAGER_REVIEWING.
   * Called via PATCH /manager/requests/:id/review when the manager opens a request.
   * Uses entityManager.update() to avoid cascade side-effects on breakdown items.
   */
  async startReview(
    id: number,
    managerId: number,
    dto: StartReviewDto,
    ipAddress: string,
    userAgent: string,
  ) {
    this.logger.log(
      `Starting review for request ID: ${id} by manager: ${managerId}`,
    );

    const request = await this.paymentRequestRepository.findOne({
      where: {
        id,
        managerUserId: managerId,
        isDeleted: false,
      },
    });

    if (!request) {
      throw new NotFoundException('指定された申請が見つかりません');
    }

    if (request.statusId !== Number(PaymentStatus.SUBMITTED_MANAGER)) {
      throw new BadRequestException(
        `リクエストの状態が「提出済み」ではないため、レビューを開始できません（現在の状態: ${request.statusId}）`,
      );
    }

    const dbTime = new Date(request.modifiedDate).getTime();
    const clientTime = new Date(dto.modifiedDate).getTime();
    if (dbTime !== clientTime) {
      throw new ConflictException({
        errorCode: 'ERR-MGR-409',
        message:
          'この申請は他のユーザーによって更新されました。リストを更新します。',
      });
    }

    try {
      await this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          await entityManager.update(
            PaymentRequest,
            { id },
            {
              statusId: PaymentStatus.MANAGER_REVIEWING,
              currentAssignedToUserId: managerId,
              modifiedDate: new Date(),
            },
          );

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
    } catch (err) {
      const detail = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(
        `[startReview] Transaction failed for request ID: ${id} — ${detail}`,
        err,
      );
      throw new BadRequestException({
        errorCode: 'ERR-MGR-REVIEW-FAIL',
        message: `レビューの開始に失敗しました: ${detail}`,
      });
    }

    const updatedRequest = await this.paymentRequestRepository.findOne({
      where: { id },
      relations: [
        'applicant',
        'breakdowns',
        'receipts',
        'approvalLogs',
        'approvalLogs.action_taken_by_user',
      ],
    });

    if (updatedRequest) {
      try {
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

        this.websocketGateway.sendPersonalNotification(
          managerId,
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
      } catch (wsErr) {
        this.logger.warn(
          `WebSocket notification failed for request ID: ${id}`,
          wsErr,
        );
      }

      return this.serializeRequest(updatedRequest);
    }

    return this.serializeRequest(request);
  }

  async verifyRequest(
    id: number,
    managerId: number,
    dto: ApproveRequestDto,
    ipAddress: string,
    userAgent: string,
    managerName: string,
  ) {
    this.logger.log(`Verifying request ${id} by manager ${managerId}`);

    if (!id || id <= 0) {
      throw new BadRequestException({
        errorCode: 'ERR-MGR-INVALID-ID',
        message: '有効な申請IDが指定されていません',
      });
    }

    try {
      const txResult = await this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          const request = await entityManager.findOne(PaymentRequest, {
            where: {
              id: id,
              currentAssignedToUserId: managerId,
              isDeleted: false,
            },
            lock: { mode: 'pessimistic_write' },
          });

          if (!request) {
            throw new NotFoundException('指定された申請が見つかりません');
          }

          if (
            request.statusId !== Number(PaymentStatus.MANAGER_REVIEWING) &&
            request.statusId !== Number(PaymentStatus.SUBMITTED_MANAGER)
          ) {
            throw new BadRequestException(
              'この申請は現在レビュー中または提出済み状態ではないため、承認できません',
            );
          }

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
          let nextAssigneeId = request.finalApproverUserId;

          if (!nextAssigneeId) {
            const activeApprover = await entityManager.findOne(User, {
              where: {
                roleId: UserRole.APPROVER,
                isActive: true,
              },
              order: { userId: 'ASC' },
            });

            if (!activeApprover) {
              throw new BadRequestException({
                errorCode: 'ERR-MGR-NO-APPROVER',
                message:
                  '利用可能な承認者がいません。管理者に連絡してください。',
              });
            }

            nextAssigneeId = activeApprover.userId;
            this.logger.log(
              `Auto-assigned approver userId=${nextAssigneeId} for request ${id}`,
            );
          }

          await entityManager.update(
            PaymentRequest,
            { id },
            {
              statusId: PaymentStatus.SUBMITTED_APPROVER,
              submittedToApproverDate: new Date(),
              finalApproverUserId: nextAssigneeId,
              currentAssignedToUserId: nextAssigneeId,
              modifiedDate: new Date(),
            },
          );

          await this.auditLogService.createLog(entityManager, {
            paymentRequestId: id,
            actionTakenByUserId: managerId,
            actionTypeId: ApprovalActionType.MGR_VERIFIED,
            previousStatusId: previousStatus,
            newStatusId: PaymentStatus.SUBMITTED_APPROVER,
            comment: dto.comment || '承認されました。',
            ipAddress,
            userAgent,
          });

          return {
            previousStatus,
            requestNumber: request.requestNumber,
            nextAssigneeId,
          };
        },
      );

      try {
        this.websocketGateway.sendPersonalNotification(
          txResult.nextAssigneeId,
          'statusUpdate',
          {
            event: 'statusUpdate',
            paymentRequestId: id,
            requestNumber: txResult.requestNumber,
            previousStatusId: txResult.previousStatus,
            newStatusId: PaymentStatus.SUBMITTED_APPROVER,
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

        this.websocketGateway.sendStatusUpdate(RoleCode.APPROVER, {
          event: 'queueChange',
          action: 'NEW_REQUEST',
          requestId: id,
        });
      } catch (wsErr) {
        this.logger.warn(
          `WebSocket notification failed for request ID: ${id}`,
          wsErr,
        );
      }

      return {
        success: true,
        message: '申請を承認し、承認者に転送しました。',
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('DEBUG ERROR:', err.message, err.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException({
        errorCode: 'ERR-MGR-VERIFY-FAIL',
        message: `承認処理に失敗しました: ${err.message}`,
      });
    }
  }

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

    if (!id || id <= 0) {
      throw new BadRequestException({
        errorCode: 'ERR-MGR-INVALID-ID',
        message: '有効な申請IDが指定されていません',
      });
    }

    try {
      const txResult = await this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          const request = await entityManager.findOne(PaymentRequest, {
            where: {
              id: id,
              currentAssignedToUserId: managerId,
              isDeleted: false,
            },
            lock: { mode: 'pessimistic_write' },
          });

          if (!request) {
            throw new NotFoundException('指定された申請が見つかりません');
          }

          if (
            request.statusId !== Number(PaymentStatus.MANAGER_REVIEWING) &&
            request.statusId !== Number(PaymentStatus.SUBMITTED_MANAGER)
          ) {
            throw new BadRequestException(
              'この申請は現在レビュー中または提出済み状態ではないため、差し戻しできません',
            );
          }

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

          await entityManager.update(
            PaymentRequest,
            { id },
            {
              statusId: PaymentStatus.REJECTED_MANAGER,
              modifiedDate: new Date(),
              currentAssignedToUserId: request.applicantUserId,
            },
          );

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

          return {
            previousStatus,
            requestNumber: request.requestNumber,
          };
        },
      );

      try {
        this.websocketGateway.sendPersonalNotification(
          managerId,
          'statusUpdate',
          {
            event: 'statusUpdate',
            paymentRequestId: id,
            requestNumber: txResult.requestNumber,
            previousStatusId: txResult.previousStatus,
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
      } catch (wsErr) {
        this.logger.warn(
          `WebSocket notification failed for request ID: ${id}`,
          wsErr,
        );
      }

      return {
        success: true,
        message: '申請を差し戻しました。申請者に通知されます。',
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('DEBUG ERROR:', err.message, err.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException({
        errorCode: 'ERR-MGR-REJECT-FAIL',
        message: `差し戻し処理に失敗しました: ${err.message}`,
      });
    }
  }
}
