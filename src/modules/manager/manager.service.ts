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

  async getPendingRequests(managerId: number, query: QueryRequestsDto) {
    this.logger.log(
      `Fetching requests for manager: ${managerId} with filters: ${JSON.stringify(query)}`,
    );
    const { statusId, date, applicant } = query;

    const qb = this.paymentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('request.currentAssignedToUserId = :managerId', { managerId })
      .andWhere('request.isDeleted = false');

    if (statusId) {
      qb.andWhere('request.statusId = :statusId', { statusId });
    } else {
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

    qb.orderBy('request.submittedToManagerDate', 'ASC');

    return qb.getMany();
  }

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
        currentAssignedToUserId: managerId,
        isDeleted: false,
      },
      relations: [
        'applicant',
        'breakdownItems',
        'receiptFiles',
        'approvalLogs',
      ],
    });

    if (!request) {
      throw new NotFoundException('指定された申請が見つかりません');
    }

    if (request.statusId === Number(PaymentStatus.SUBMITTED_MANAGER)) {
      this.logger.log(
        `Auto-transitioning request ID: ${id} to MANAGER_REVIEWING`,
      );

      await this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          request.statusId = PaymentStatus.MANAGER_REVIEWING;
          request.modifiedDate = new Date();
          await entityManager.save(request);

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

      const updatedRequest = await this.paymentRequestRepository.findOne({
        where: { paymentRequestId: id },
        relations: [
          'applicant',
          'breakdownItems',
          'receiptFiles',
          'approvalLogs',
        ],
      });

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

    if (request.approvalLogs) {
      request.approvalLogs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }

    return request;
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

    return await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        const request = await entityManager.findOne(PaymentRequest, {
          where: {
            paymentRequestId: id,
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

        request.statusId = PaymentStatus.MANAGER_VERIFIED;
        request.managerVerificationDate = new Date();
        request.modifiedDate = new Date();
        request.currentAssignedToUserId = request.applicantUserId;
        await entityManager.save(request);

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
        const request = await entityManager.findOne(PaymentRequest, {
          where: {
            paymentRequestId: id,
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

        request.statusId = PaymentStatus.REJECTED_MANAGER;
        request.modifiedDate = new Date();
        request.currentAssignedToUserId = request.applicantUserId;
        await entityManager.save(request);

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
