// ============================================================
// src/modules/approver/approver.service.ts
// Business logic for the Final Approver dashboard workspace.
// Handles queue queries, review-start transitions, approvals, and rejections.
// All state mutations are wrapped in transactions with pessimistic locking.
// ============================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Brackets } from 'typeorm';

import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { User } from '../shared/entities/user.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { AuditLogService } from '../shared/services/audit-log.service';
import { RedisService } from '../shared/services/redis.service';
import { WebsocketGateway } from '../shared/websocket.gateway';
import { buildPaginationMeta } from '../shared/utils/pagination.util';
import {
  PaymentStatus,
  ApprovalActionType,
  CURRENCY_CODES,
  PAYMENT_TYPE_LABELS_JP,
  PAYMENT_METHOD_LABELS_JP,
} from '../shared/types';
import {
  QueryApproverRequestsDto,
  ApproverRequestSortFields,
} from './dto/query-approver-requests.dto';
import { ApprovePaymentRequestDto } from './dto/approve-payment-request.dto';
import { RejectPaymentRequestDto } from './dto/reject-payment-request.dto';
import {
  ApproverRequestListItem,
  ApproverRequestDetailView,
} from './dto/query-approver-requests.dto';

export interface AuditContext {
  ipAddress: string;
  userAgent: string;
}

interface BreakdownItemRow {
  payment_breakdown_item_id: number;
  payment_request_id: number;
  line_number: number;
  item_date: string;
  description: string;
  amount: number;
  quantity: number;
  unit_price: number;
  created_date: string;
  modified_date: string;
}

@Injectable()
export class ApproverService {
  private readonly logger = new Logger(ApproverService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async findAssignedRequests(
    approverUserId: number,
    query: QueryApproverRequestsDto,
  ) {
    const {
      statusId,
      search,
      branch,
      desiredDate,
      desiredDateAlert,
      showAll,
      page = 1,
      pageSize = 10,
      sortBy = ApproverRequestSortFields.MANAGER_VERIFIED_DATE,
      sortOrder = 'DESC',
    } = query;

    this.logger.log(
      `Fetching pending requests for final approver: ${approverUserId}`,
    );

    const qb = this.paymentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .leftJoinAndSelect('request.manager', 'manager')
      .where('request.is_deleted = false');

    const allowedStatuses = [
      PaymentStatus.SUBMITTED_APPROVER,
      PaymentStatus.APPROVER_REVIEWING,
      PaymentStatus.APPROVED,
      PaymentStatus.REJECTED_APPROVER,
      PaymentStatus.PAID,
    ];

    if (desiredDateAlert) {
      qb.andWhere('request.status_id IN (:...alertStatuses)', {
        alertStatuses: [
          PaymentStatus.SUBMITTED_APPROVER,
          PaymentStatus.APPROVER_REVIEWING,
        ],
      });
    } else if (statusId) {
      if (!allowedStatuses.includes(statusId)) {
        throw new BadRequestException(
          'Invalid status query for approver queue.',
        );
      }
      qb.andWhere('request.status_id = :statusId', { statusId });
    } else if (showAll) {
      qb.andWhere('request.status_id IN (:...statuses)', {
        statuses: allowedStatuses,
      });
    } else {
      qb.andWhere('request.status_id IN (:...statuses)', {
        statuses: [
          PaymentStatus.SUBMITTED_APPROVER,
          PaymentStatus.APPROVER_REVIEWING,
        ],
      });
    }

    if (!desiredDateAlert) {
      qb.andWhere(this.approverAccessBrackets(approverUserId));
    }

    if (branch) {
      qb.andWhere('LOWER(applicant.branch) LIKE LOWER(:branch)', {
        branch: `%${branch}%`,
      });
    }

    if (desiredDate) {
      qb.andWhere('request.desired_payment_date = :desiredDate', {
        desiredDate,
      });
    }

    if (desiredDateAlert) {
      qb.andWhere(
        `request.desired_payment_date <= CURRENT_DATE + interval '3 days'`,
      );
    }

    if (search) {
      qb.andWhere(this.searchBrackets(search));
    }

    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === ApproverRequestSortFields.TOTAL_AMOUNT) {
      qb.orderBy('request.totalAmount', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.STATUS) {
      qb.orderBy('request.statusId', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.APPLICATION_DATE) {
      qb.orderBy('request.applicationDate', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.DESIRED_PAYMENT_DATE) {
      qb.orderBy('request.desiredPaymentDate', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.CREATED_DATE) {
      qb.orderBy('request.createdDate', orderDirection);
    } else {
      qb.orderBy('request.managerVerificationDate', orderDirection);
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const items: ApproverRequestListItem[] = data.map((req) => ({
      paymentRequestId: req.id,
      requestNumber: req.requestNumber,
      applicant: {
        userId: req.applicant?.userId ?? Number(req.applicantUserId),
        fullName: req.applicant?.fullName ?? '',
        employeeNumber: req.applicant?.employeeNumber ?? '',
        branch: req.applicant?.branch ?? '',
        department: req.applicant?.department ?? '',
        email: req.applicant?.email ?? '',
      },
      manager: req.manager
        ? {
            userId: req.manager.userId,
            fullName: req.manager.fullName,
            employeeNumber: req.manager.employeeNumber,
            branch: req.manager.branch,
            department: req.manager.department ?? '',
            email: req.manager.email ?? '',
          }
        : null,
      applicationDate: req.applicationDate,
      desiredPaymentDate: req.desiredPaymentDate,
      totalAmount: req.totalAmount,
      currencyCode:
        (CURRENCY_CODES as Record<number, string>)[req.currencyId] || 'MMK',
      statusId: req.statusId,
      purpose: req.purpose,
      managerVerificationDate: req.managerVerificationDate
        ? req.managerVerificationDate.toISOString()
        : null,
      submittedToApproverDate: req.submittedToApproverDate
        ? req.submittedToApproverDate.toISOString()
        : null,
      createdDate: req.createdDate.toISOString(),
    }));

    return {
      data: items,
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getSummary(approverUserId: number) {
    this.logger.log(`Fetching summary for final approver: ${approverUserId}`);

    const baseQb = this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere(this.approverAccessBrackets(approverUserId));

    const pendingCount = await baseQb
      .clone()
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.SUBMITTED_APPROVER,
      })
      .getCount();

    const reviewingCount = await baseQb
      .clone()
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.APPROVER_REVIEWING,
      })
      .getCount();

    const approvedCount = await baseQb
      .clone()
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.APPROVED,
      })
      .getCount();

    const rejectedCount = await baseQb
      .clone()
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.REJECTED_APPROVER,
      })
      .getCount();

    const paidCount = await baseQb
      .clone()
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.PAID,
      })
      .getCount();

    const totalQueue = await baseQb.clone().getCount();

    const desiredDateAlertCount = await this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere('request.status_id IN (:...alertStatuses)', {
        alertStatuses: [
          PaymentStatus.SUBMITTED_APPROVER,
          PaymentStatus.APPROVER_REVIEWING,
        ],
      })
      .andWhere(
        `request.desired_payment_date <= CURRENT_DATE + interval '3 days'`,
      )
      .getCount();

    return {
      pendingCount,
      reviewingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      totalQueue,
      desiredDateAlertCount,
    };
  }

  async findOneForReview(
    id: number,
    approverUserId: number,
    auditContext: AuditContext,
  ): Promise<ApproverRequestDetailView> {
    const request = await this.paymentRequestRepository.findOne({
      where: { id, isDeleted: false },
      relations: [
        'applicant',
        'manager',
        'finalApprover',
        'receipts',
        'approvalLogs',
        'approvalLogs.action_taken_by_user',
      ],
    });

    const breakdownItems: BreakdownItemRow[] = await this.dataSource.query(
      `SELECT payment_breakdown_item_id, payment_request_id, line_number, item_date,
              description, amount, quantity, unit_price, created_date, modified_date
       FROM payment_breakdown_items
       WHERE payment_request_id = $1
       ORDER BY line_number ASC`,
      [id],
    );

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (
      request.statusId !== Number(PaymentStatus.SUBMITTED_APPROVER) &&
      request.statusId !== Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.statusId !== Number(PaymentStatus.APPROVED) &&
      request.statusId !== Number(PaymentStatus.REJECTED_APPROVER) &&
      request.statusId !== Number(PaymentStatus.PAID)
    ) {
      throw new ForbiddenException(
        'You do not have access to view this request in its current state.',
      );
    }

    if (
      request.statusId === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.finalApproverUserId !== approverUserId
    ) {
      throw new ForbiddenException(
        'This request is currently being reviewed by another approver.',
      );
    }

    const approverUser = await this.userRepository.findOne({
      where: { userId: approverUserId },
    });
    if (!approverUser) {
      throw new NotFoundException('Approver user not found');
    }

    if (request.statusId === Number(PaymentStatus.SUBMITTED_APPROVER)) {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        const freshRequest = await manager.findOne(PaymentRequest, {
          where: {
            id,
            statusId: PaymentStatus.SUBMITTED_APPROVER,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!freshRequest) {
          throw new ConflictException(
            'This request has already been processed or is being reviewed by another user.',
          );
        }

        freshRequest.statusId = PaymentStatus.APPROVER_REVIEWING;
        freshRequest.finalApproverUserId = approverUserId;
        freshRequest.currentAssignedToUserId = approverUserId;
        freshRequest.modifiedDate = new Date();
        await manager.save(PaymentRequest, freshRequest);

        await manager.query(
          `INSERT INTO approval_logs
            (payment_request_id, action_taken_by_user_id, action_type_id,
             previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [
            id,
            approverUserId,
            ApprovalActionType.APPR_REVIEW_START,
            PaymentStatus.SUBMITTED_APPROVER,
            PaymentStatus.APPROVER_REVIEWING,
            'Approver review started',
            auditContext.ipAddress,
            auditContext.userAgent,
          ],
        );
      });

      await this.redisService.del(`payment_request:payload:${id}`);

      const statusUpdatePayload = {
        paymentRequestId: request.id,
        requestNumber: request.requestNumber,
        previousStatusId: PaymentStatus.SUBMITTED_APPROVER,
        newStatusId: PaymentStatus.APPROVER_REVIEWING,
        actionByUserId: approverUserId,
        actionByUserName: approverUser.fullName,
        timestamp: new Date().toISOString(),
      };

      try {
        this.websocketGateway.sendPersonalNotification(
          request.applicantUserId,
          'request:status-changed',
          statusUpdatePayload,
        );
      } catch (wsError) {
        this.logger.warn(
          `WebSocket notification failed for request ${id}`,
          wsError,
        );
      }

      request.statusId = PaymentStatus.APPROVER_REVIEWING;
      request.finalApproverUserId = approverUserId;
      request.currentAssignedToUserId = approverUserId;

      const reloadedLogs = await this.dataSource
        .getRepository(ApprovalLog)
        .find({
          where: { paymentRequestId: id },
          relations: ['action_taken_by_user'],
          order: { timestamp: 'DESC' },
        });
      request.approvalLogs = reloadedLogs;
    }

    const sortedLogs = [...request.approvalLogs].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const canApprove =
      request.statusId === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.finalApproverUserId === approverUserId;
    const canReject =
      request.statusId === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.finalApproverUserId === approverUserId;

    const latestManagerComment =
      [...request.approvalLogs]
        .reverse()
        .find(
          (log) => log.actionTypeId === Number(ApprovalActionType.MGR_VERIFIED),
        )?.comment || null;

    const latestApplicantSubmissionComment =
      [...request.approvalLogs]
        .reverse()
        .find(
          (log) => log.actionTypeId === Number(ApprovalActionType.SUBMITTED),
        )?.comment || null;

    const finalApproverUser = request.finalApprover
      ? {
          userId: request.finalApprover.userId,
          fullName: request.finalApprover.fullName,
          employeeNumber: request.finalApprover.employeeNumber,
          branch: request.finalApprover.branch,
          department: request.finalApprover.department ?? '',
          email: request.finalApprover.email ?? '',
        }
      : null;

    return {
      paymentRequestId: request.id,
      requestNumber: request.requestNumber,
      applicantUserId: request.applicantUserId,
      managerUserId: request.managerUserId,
      finalApproverUserId: request.finalApproverUserId,
      accountingUserId: request.accountingUserId,
      currentAssignedToUserId: request.currentAssignedToUserId,
      applicationDate: request.applicationDate,
      desiredPaymentDate: request.desiredPaymentDate,
      totalAmount: request.totalAmount,
      currencyId: request.currencyId,
      paymentTypeId: request.paymentTypeId,
      paymentMethodId: request.paymentMethodId,
      purpose: request.purpose,
      bankAccountInfo: request.bankAccountInfo,
      requestContent: request.requestContent,
      hasReceipt: request.hasReceipt,
      statusId: request.statusId,
      submittedToManagerDate:
        request.submittedToManagerDate?.toISOString() ?? null,
      managerVerificationDate:
        request.managerVerificationDate?.toISOString() ?? null,
      submittedToApproverDate:
        request.submittedToApproverDate?.toISOString() ?? null,
      approvalDate: request.approvalDate?.toISOString() ?? null,
      paymentCompletedDate: request.paymentCompletedDate?.toISOString() ?? null,
      createdDate: request.createdDate.toISOString(),
      modifiedDate: request.modifiedDate.toISOString(),
      isDeleted: request.isDeleted,
      applicant: {
        userId: request.applicant?.userId ?? Number(request.applicantUserId),
        fullName: request.applicant?.fullName ?? '',
        employeeNumber: request.applicant?.employeeNumber ?? '',
        branch: request.applicant?.branch ?? '',
        department: request.applicant?.department ?? '',
        email: request.applicant?.email ?? '',
      },
      manager: request.manager
        ? {
            userId: request.manager.userId,
            fullName: request.manager.fullName,
            employeeNumber: request.manager.employeeNumber,
            branch: request.manager.branch,
            department: request.manager.department ?? '',
            email: request.manager.email ?? '',
          }
        : null,
      finalApprover: finalApproverUser,
      currencyCode:
        (CURRENCY_CODES as Record<number, string>)[request.currencyId] || 'MMK',
      paymentTypeName:
        (PAYMENT_TYPE_LABELS_JP as Record<number, string>)[
          request.paymentTypeId
        ] || '経費精算',
      paymentMethodName:
        (PAYMENT_METHOD_LABELS_JP as Record<number, string>)[
          request.paymentMethodId
        ] || '銀行振込',
      breakdownItems: breakdownItems.map((item: BreakdownItemRow) => ({
        paymentBreakdownItemId: item.payment_breakdown_item_id,
        paymentRequestId: item.payment_request_id,
        lineNumber: item.line_number,
        itemDate: item.item_date,
        description: item.description,
        amount: String(item.amount),
        quantity: item.quantity != null ? String(item.quantity) : null,
        unitPrice: item.unit_price != null ? String(item.unit_price) : null,
        createdDate: item.created_date,
        modifiedDate: item.modified_date,
      })),
      receiptFiles: request.receipts.map((file) => ({
        receiptFileId: file.id,
        paymentRequestId: file.paymentRequestId,
        originalFileName: file.originalFileName ?? '',
        storedFileName: file.storedFileName ?? '',
        fileStoragePath: file.storage_key,
        fileSize: String(file.file_size),
        mimeType: file.mime_type,
        uploadedByUserId: file.uploadedByUserId ?? 0,
        uploadedDate: file.uploadedDate.toISOString(),
        isDeleted: file.isDeleted,
      })),
      approvalLogs: sortedLogs.map((log) => ({
        approvalLogId: log.approvalLogId,
        paymentRequestId: log.paymentRequestId,
        actionTakenByUserId: Number(log.actionTakenByUserId),
        actionTypeId: log.actionTypeId,
        previousStatusId: log.previousStatusId,
        newStatusId: log.newStatusId,
        comment: log.comment,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp:
          typeof log.timestamp === 'string'
            ? log.timestamp
            : log.timestamp.toISOString(),
        actionTakenByUser: log.action_taken_by_user
          ? {
              userId: log.action_taken_by_user.userId,
              fullName: log.action_taken_by_user.fullName,
              employeeNumber: log.action_taken_by_user.employeeNumber,
              branch: log.action_taken_by_user.branch,
              department: log.action_taken_by_user.department ?? '',
              email: log.action_taken_by_user.email ?? '',
            }
          : {
              userId: 0,
              fullName: 'Unknown',
              employeeNumber: '',
              branch: '',
              department: '',
              email: '',
            },
      })),
      canApprove,
      canReject,
      latestManagerComment,
      latestApplicantSubmissionComment,
    };
  }

  async approve(
    id: number,
    approverUserId: number,
    dto: ApprovePaymentRequestDto,
    auditContext: AuditContext,
  ) {
    this.logger.log(`Approve request: id=${id}, userId=${approverUserId}`);

    const request = await this.paymentRequestRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.statusId !== Number(PaymentStatus.APPROVER_REVIEWING)) {
      throw new ConflictException(
        'This request is not in Reviewing state and cannot be approved.',
      );
    }

    if (request.finalApproverUserId !== approverUserId) {
      throw new ForbiddenException(
        'You are not assigned to review this request.',
      );
    }

    const approverUser = await this.userRepository.findOne({
      where: { userId: approverUserId },
    });
    if (!approverUser) {
      throw new NotFoundException('Approver user not found');
    }

    try {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        const freshRequest = await manager.findOne(PaymentRequest, {
          where: {
            id,
            statusId: PaymentStatus.APPROVER_REVIEWING,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!freshRequest) {
          throw new ConflictException(
            'This request has already been processed or modified by another user.',
          );
        }

        freshRequest.statusId = PaymentStatus.APPROVED;
        freshRequest.approvalDate = new Date();
        freshRequest.accountingUserId = dto.accountingUserId ?? null;
        freshRequest.currentAssignedToUserId = dto.accountingUserId ?? null;
        freshRequest.modifiedDate = new Date();
        await manager.save(PaymentRequest, freshRequest);

        await manager.query(
          `INSERT INTO approval_logs
            (payment_request_id, action_taken_by_user_id, action_type_id,
             previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [
            id,
            approverUserId,
            ApprovalActionType.APPROVED,
            PaymentStatus.APPROVER_REVIEWING,
            PaymentStatus.APPROVED,
            dto.comment || 'Approved by Final Approver',
            auditContext.ipAddress,
            auditContext.userAgent,
          ],
        );
      });

      await this.redisService.del(`payment_request:payload:${id}`);

      try {
        const statusUpdatePayload = {
          paymentRequestId: request.id,
          requestNumber: request.requestNumber,
          previousStatusId: PaymentStatus.APPROVER_REVIEWING,
          newStatusId: PaymentStatus.APPROVED,
          actionByUserId: approverUserId,
          actionByUserName: approverUser.fullName,
          timestamp: new Date().toISOString(),
        };

        this.websocketGateway.sendPersonalNotification(
          request.applicantUserId,
          'request:status-changed',
          statusUpdatePayload,
        );

        this.websocketGateway.sendStatusUpdate(
          'ACCOUNTING',
          statusUpdatePayload,
        );
      } catch (wsError) {
        this.logger.warn(
          `WebSocket notification failed for request ${id}`,
          wsError,
        );
      }

      this.logger.log(`Request ${id} approved successfully`);
      return { success: true, message: 'Request successfully approved.' };
    } catch (error) {
      this.logger.error(`Failed to approve request ${id}`, error);
      throw error;
    }
  }

  async reject(
    id: number,
    approverUserId: number,
    dto: RejectPaymentRequestDto,
    auditContext: AuditContext,
  ) {
    this.logger.log(`Reject request: id=${id}, userId=${approverUserId}`);

    const request = await this.paymentRequestRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.statusId !== Number(PaymentStatus.APPROVER_REVIEWING)) {
      throw new ConflictException(
        'This request is not in Reviewing state and cannot be rejected.',
      );
    }

    if (request.finalApproverUserId !== approverUserId) {
      throw new ForbiddenException(
        'You are not assigned to review this request.',
      );
    }

    const approverUser = await this.userRepository.findOne({
      where: { userId: approverUserId },
    });
    if (!approverUser) {
      throw new NotFoundException('Approver user not found');
    }

    try {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        const freshRequest = await manager.findOne(PaymentRequest, {
          where: {
            id,
            statusId: PaymentStatus.APPROVER_REVIEWING,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!freshRequest) {
          throw new ConflictException(
            'This request has already been processed or modified by another user.',
          );
        }

        freshRequest.statusId = PaymentStatus.REJECTED_APPROVER;
        freshRequest.currentAssignedToUserId = freshRequest.applicantUserId;
        freshRequest.modifiedDate = new Date();
        await manager.save(PaymentRequest, freshRequest);

        await manager.query(
          `INSERT INTO approval_logs
            (payment_request_id, action_taken_by_user_id, action_type_id,
             previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [
            id,
            approverUserId,
            ApprovalActionType.APPR_REJECTED,
            PaymentStatus.APPROVER_REVIEWING,
            PaymentStatus.REJECTED_APPROVER,
            dto.comment,
            auditContext.ipAddress,
            auditContext.userAgent,
          ],
        );
      });

      await this.redisService.del(`payment_request:payload:${id}`);

      try {
        const statusUpdatePayload = {
          paymentRequestId: request.id,
          requestNumber: request.requestNumber,
          previousStatusId: PaymentStatus.APPROVER_REVIEWING,
          newStatusId: PaymentStatus.REJECTED_APPROVER,
          actionByUserId: approverUserId,
          actionByUserName: approverUser.fullName,
          timestamp: new Date().toISOString(),
        };

        this.websocketGateway.sendPersonalNotification(
          request.applicantUserId,
          'request:status-changed',
          statusUpdatePayload,
        );
      } catch (wsError) {
        this.logger.warn(
          `WebSocket notification failed for request ${id}`,
          wsError,
        );
      }

      this.logger.log(`Request ${id} rejected successfully`);
      return {
        success: true,
        message: 'Request successfully rejected and returned to applicant.',
      };
    } catch (error) {
      this.logger.error(`Failed to reject request ${id}`, error);
      throw error;
    }
  }

  private approverAccessBrackets(approverUserId: number): Brackets {
    return new Brackets(this.buildApproverAccessCondition(approverUserId));
  }

  private buildApproverAccessCondition(approverUserId: number) {
    return (qb: import('typeorm').WhereExpressionBuilder) => {
      qb.where('request.status_id = :submittedStatus', {
        submittedStatus: PaymentStatus.SUBMITTED_APPROVER,
      }).orWhere(
        'request.status_id IN (:...assignedStatuses) AND request.final_approver_user_id = :approverUserId',
        {
          assignedStatuses: [
            PaymentStatus.APPROVER_REVIEWING,
            PaymentStatus.APPROVED,
            PaymentStatus.REJECTED_APPROVER,
            PaymentStatus.PAID,
          ],
          approverUserId,
        },
      );
    };
  }

  private searchBrackets(search: string): Brackets {
    return new Brackets(this.buildSearchCondition(search));
  }

  private buildSearchCondition(search: string) {
    return (qb: import('typeorm').WhereExpressionBuilder) => {
      qb.where('request.request_number LIKE :search', { search: `%${search}%` })
        .orWhere('applicant.full_name LIKE :search', { search: `%${search}%` })
        .orWhere('request.purpose LIKE :search', { search: `%${search}%` });
    };
  }
}
