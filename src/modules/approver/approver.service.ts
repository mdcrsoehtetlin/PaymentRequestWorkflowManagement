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
      dateFrom,
      dateTo,
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
    ];

    if (statusId) {
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

    qb.andWhere(
      new Brackets((innerQb) => {
        innerQb
          .where('request.status_id = :submittedStatus', {
            submittedStatus: PaymentStatus.SUBMITTED_APPROVER,
          })
          .orWhere(
            'request.status_id IN (:...assignedStatuses) AND request.final_approver_user_id = :approverUserId',
            {
              assignedStatuses: [
                PaymentStatus.APPROVER_REVIEWING,
                PaymentStatus.APPROVED,
                PaymentStatus.REJECTED_APPROVER,
              ],
              approverUserId,
            },
          );
      }),
    );

    if (branch) {
      qb.andWhere('LOWER(applicant.branch) LIKE LOWER(:branch)', {
        branch: `%${branch}%`,
      });
    }

    if (dateFrom) {
      qb.andWhere('request.submitted_to_approver_date >= :dateFrom', {
        dateFrom,
      });
    }
    if (dateTo) {
      qb.andWhere('request.submitted_to_approver_date <= :dateTo', { dateTo });
    }

    if (search) {
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where('request.request_number LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('applicant.full_name LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('request.purpose LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === ApproverRequestSortFields.TOTAL_AMOUNT) {
      qb.orderBy('request.total_amount', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.STATUS) {
      qb.orderBy('request.status_id', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.APPLICATION_DATE) {
      qb.orderBy('request.application_date', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.DESIRED_PAYMENT_DATE) {
      qb.orderBy('request.desired_payment_date', orderDirection);
    } else if (sortBy === ApproverRequestSortFields.CREATED_DATE) {
      qb.orderBy('request.created_at', orderDirection);
    } else {
      qb.orderBy('request.manager_verification_date', orderDirection);
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const items: ApproverRequestListItem[] = data.map((req) => ({
      paymentRequestId: req.id,
      requestNumber: req.request_number,
      applicant: {
        userId: req.applicant?.userId ?? Number(req.applicant_user_id),
        fullName: req.applicant?.fullName ?? '',
        employeeNumber: req.applicant?.employeeNumber ?? '',
        branch: req.applicant?.branch ?? '',
      },
      manager: req.manager
        ? {
            userId: req.manager.userId,
            fullName: req.manager.fullName,
            employeeNumber: req.manager.employeeNumber,
            branch: req.manager.branch,
          }
        : null,
      applicationDate: req.application_date,
      desiredPaymentDate: req.desired_payment_date,
      totalAmount: req.total_amount,
      currencyCode:
        (CURRENCY_CODES as Record<number, string>)[req.currency_id] || 'MMK',
      statusId: req.status_id,
      purpose: req.purpose,
      managerVerificationDate: req.manager_verification_date
        ? req.manager_verification_date.toISOString()
        : null,
      submittedToApproverDate: req.submitted_to_approver_date
        ? req.submitted_to_approver_date.toISOString()
        : null,
      createdDate: req.created_at.toISOString(),
    }));

    return {
      data: items,
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  async getSummary(approverUserId: number) {
    this.logger.log(`Fetching summary for final approver: ${approverUserId}`);

    const pendingCount = await this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.SUBMITTED_APPROVER,
      })
      .getCount();

    const reviewingCount = await this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.APPROVER_REVIEWING,
      })
      .andWhere('request.final_approver_user_id = :approverUserId', {
        approverUserId,
      })
      .getCount();

    const approvedCount = await this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.APPROVED,
      })
      .andWhere('request.final_approver_user_id = :approverUserId', {
        approverUserId,
      })
      .getCount();

    const rejectedCount = await this.paymentRequestRepository
      .createQueryBuilder('request')
      .where('request.is_deleted = false')
      .andWhere('request.status_id = :statusId', {
        statusId: PaymentStatus.REJECTED_APPROVER,
      })
      .andWhere('request.final_approver_user_id = :approverUserId', {
        approverUserId,
      })
      .getCount();

    const totalAll =
      pendingCount + reviewingCount + approvedCount + rejectedCount;

    return {
      pendingCount,
      reviewingCount,
      approvedCount,
      rejectedCount,
      totalQueue: totalAll,
    };
  }

  async findOneForReview(
    id: number,
    approverUserId: number,
    auditContext: AuditContext,
  ): Promise<ApproverRequestDetailView> {
    const request = await this.paymentRequestRepository.findOne({
      where: { id, is_deleted: false },
      relations: [
        'applicant',
        'manager',
        'final_approver',
        'receipts',
        'logs',
        'logs.action_taken_by_user',
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
      request.status_id !== Number(PaymentStatus.SUBMITTED_APPROVER) &&
      request.status_id !== Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.status_id !== Number(PaymentStatus.APPROVED) &&
      request.status_id !== Number(PaymentStatus.REJECTED_APPROVER) &&
      request.status_id !== Number(PaymentStatus.PAID)
    ) {
      throw new ForbiddenException(
        'You do not have access to view this request in its current state.',
      );
    }

    if (
      request.status_id === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.final_approver_user_id !== approverUserId
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

    if (request.status_id === Number(PaymentStatus.SUBMITTED_APPROVER)) {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        const freshRequest = await manager.findOne(PaymentRequest, {
          where: {
            id,
            status_id: PaymentStatus.SUBMITTED_APPROVER,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!freshRequest) {
          throw new ConflictException(
            'This request has already been processed or is being reviewed by another user.',
          );
        }

        freshRequest.status_id = PaymentStatus.APPROVER_REVIEWING;
        freshRequest.final_approver_user_id = approverUserId;
        freshRequest.current_assigned_to_user_id = approverUserId;
        freshRequest.updated_at = new Date();
        await manager.save(PaymentRequest, freshRequest);

        await this.auditLogService.createLog(manager, {
          paymentRequestId: id,
          actionTakenByUserId: approverUserId,
          actionTypeId: ApprovalActionType.APPR_REVIEW_START,
          previousStatusId: PaymentStatus.SUBMITTED_APPROVER,
          newStatusId: PaymentStatus.APPROVER_REVIEWING,
          comment: 'Approver review started',
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        });
      });

      await this.redisService.del(`payment_request:payload:${id}`);

      const statusUpdatePayload = {
        paymentRequestId: request.id,
        requestNumber: request.request_number,
        previousStatusId: PaymentStatus.SUBMITTED_APPROVER,
        newStatusId: PaymentStatus.APPROVER_REVIEWING,
        actionByUserId: approverUserId,
        actionByUserName: approverUser.fullName,
        timestamp: new Date().toISOString(),
      };
      this.websocketGateway.sendPersonalNotification(
        request.applicant_user_id,
        'request:status-changed',
        statusUpdatePayload,
      );

      request.status_id = PaymentStatus.APPROVER_REVIEWING;
      request.final_approver_user_id = approverUserId;
      request.current_assigned_to_user_id = approverUserId;

      const reloadedLogs = await this.dataSource
        .getRepository(ApprovalLog)
        .find({
          where: { payment_request_id: id },
          relations: ['action_taken_by_user'],
          order: { timestamp: 'DESC' },
        });
      request.logs = reloadedLogs;
    }

    const sortedLogs = [...request.logs].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const canApprove =
      request.status_id === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.final_approver_user_id === approverUserId;
    const canReject =
      request.status_id === Number(PaymentStatus.APPROVER_REVIEWING) &&
      request.final_approver_user_id === approverUserId;

    const latestManagerComment =
      [...request.logs]
        .reverse()
        .find(
          (log) =>
            log.action_type_id === Number(ApprovalActionType.MGR_VERIFIED),
        )?.comment || null;

    const latestApplicantSubmissionComment =
      [...request.logs]
        .reverse()
        .find(
          (log) => log.action_type_id === Number(ApprovalActionType.SUBMITTED),
        )?.comment || null;

    const finalApproverUser = request.final_approver
      ? {
          userId: request.final_approver.userId,
          fullName: request.final_approver.fullName,
          employeeNumber: request.final_approver.employeeNumber,
          branch: request.final_approver.branch,
        }
      : null;

    return {
      paymentRequestId: request.id,
      requestNumber: request.request_number,
      applicantUserId: request.applicant_user_id,
      managerUserId: request.manager_user_id,
      finalApproverUserId: request.final_approver_user_id,
      accountingUserId: request.accounting_user_id,
      currentAssignedToUserId: request.current_assigned_to_user_id,
      applicationDate: request.application_date,
      desiredPaymentDate: request.desired_payment_date,
      totalAmount: request.total_amount,
      currencyId: request.currency_id,
      paymentTypeId: request.payment_type_id,
      paymentMethodId: request.payment_method_id,
      purpose: request.purpose,
      bankAccountInfo: request.bank_account_info,
      requestContent: request.request_content,
      hasReceipt: request.has_receipt,
      statusId: request.status_id,
      submittedToManagerDate:
        request.submitted_to_manager_date?.toISOString() ?? null,
      managerVerificationDate:
        request.manager_verification_date?.toISOString() ?? null,
      submittedToApproverDate:
        request.submitted_to_approver_date?.toISOString() ?? null,
      approvalDate: request.approval_date?.toISOString() ?? null,
      paymentCompletedDate:
        request.payment_completed_date?.toISOString() ?? null,
      createdDate: request.created_at.toISOString(),
      modifiedDate: request.updated_at.toISOString(),
      isDeleted: request.is_deleted,
      applicant: {
        userId: request.applicant?.userId ?? Number(request.applicant_user_id),
        fullName: request.applicant?.fullName ?? '',
        employeeNumber: request.applicant?.employeeNumber ?? '',
        branch: request.applicant?.branch ?? '',
      },
      manager: request.manager
        ? {
            userId: request.manager.userId,
            fullName: request.manager.fullName,
            employeeNumber: request.manager.employeeNumber,
            branch: request.manager.branch,
          }
        : null,
      finalApprover: finalApproverUser,
      currencyCode:
        (CURRENCY_CODES as Record<number, string>)[request.currency_id] ||
        'MMK',
      paymentTypeName:
        (PAYMENT_TYPE_LABELS_JP as Record<number, string>)[
          request.payment_type_id
        ] || '経費精算',
      paymentMethodName:
        (PAYMENT_METHOD_LABELS_JP as Record<number, string>)[
          request.payment_method_id
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
        paymentRequestId: file.payment_request_id,
        originalFileName: file.file_name ?? '',
        storedFileName: file.stored_file_name ?? '',
        fileStoragePath: file.storage_key,
        fileSize: String(file.file_size),
        mimeType: file.mime_type,
        uploadedByUserId: file.uploaded_by_user_id ?? 0,
        uploadedDate: file.created_at.toISOString(),
        isDeleted: file.is_deleted,
      })),
      approvalLogs: sortedLogs.map((log) => ({
        approvalLogId: log.id,
        paymentRequestId: log.payment_request_id,
        actionTakenByUserId: log.action_taken_by_user_id,
        actionTypeId: log.action_type_id,
        previousStatusId: log.previous_status_id,
        newStatusId: log.new_status_id,
        comment: log.comment,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: log.timestamp.toISOString(),
        actionTakenByUser: log.action_taken_by_user
          ? {
              userId: log.action_taken_by_user.userId,
              fullName: log.action_taken_by_user.fullName,
              employeeNumber: log.action_taken_by_user.employeeNumber,
              branch: log.action_taken_by_user.branch,
            }
          : { userId: 0, fullName: 'Unknown', employeeNumber: '', branch: '' },
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
    const request = await this.paymentRequestRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.status_id !== Number(PaymentStatus.APPROVER_REVIEWING)) {
      throw new ConflictException(
        'This request is not in Reviewing state and cannot be approved.',
      );
    }

    if (request.final_approver_user_id !== approverUserId) {
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

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const freshRequest = await manager.findOne(PaymentRequest, {
        where: {
          id,
          status_id: PaymentStatus.APPROVER_REVIEWING,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!freshRequest) {
        throw new ConflictException(
          'This request has already been processed or modified by another user.',
        );
      }

      freshRequest.status_id = PaymentStatus.APPROVED;
      freshRequest.approval_date = new Date();
      freshRequest.accounting_user_id = dto.accountingUserId ?? null;
      freshRequest.current_assigned_to_user_id = dto.accountingUserId ?? null;
      freshRequest.updated_at = new Date();
      await manager.save(PaymentRequest, freshRequest);

      await this.auditLogService.createLog(manager, {
        paymentRequestId: id,
        actionTakenByUserId: approverUserId,
        actionTypeId: ApprovalActionType.APPROVED,
        previousStatusId: PaymentStatus.APPROVER_REVIEWING,
        newStatusId: PaymentStatus.APPROVED,
        comment: dto.comment || 'Approved by Final Approver',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      });
    });

    await this.redisService.del(`payment_request:payload:${id}`);

    const statusUpdatePayload = {
      paymentRequestId: request.id,
      requestNumber: request.request_number,
      previousStatusId: PaymentStatus.APPROVER_REVIEWING,
      newStatusId: PaymentStatus.APPROVED,
      actionByUserId: approverUserId,
      actionByUserName: approverUser.fullName,
      timestamp: new Date().toISOString(),
    };

    this.websocketGateway.sendPersonalNotification(
      request.applicant_user_id,
      'request:status-changed',
      statusUpdatePayload,
    );

    this.websocketGateway.sendStatusUpdate('ACCOUNTING', statusUpdatePayload);

    return { success: true, message: 'Request successfully approved.' };
  }

  async reject(
    id: number,
    approverUserId: number,
    dto: RejectPaymentRequestDto,
    auditContext: AuditContext,
  ) {
    const request = await this.paymentRequestRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.status_id !== Number(PaymentStatus.APPROVER_REVIEWING)) {
      throw new ConflictException(
        'This request is not in Reviewing state and cannot be rejected.',
      );
    }

    if (request.final_approver_user_id !== approverUserId) {
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

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const freshRequest = await manager.findOne(PaymentRequest, {
        where: {
          id,
          status_id: PaymentStatus.APPROVER_REVIEWING,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!freshRequest) {
        throw new ConflictException(
          'This request has already been processed or modified by another user.',
        );
      }

      freshRequest.status_id = PaymentStatus.REJECTED_APPROVER;
      freshRequest.current_assigned_to_user_id = freshRequest.applicant_user_id;
      freshRequest.updated_at = new Date();
      await manager.save(PaymentRequest, freshRequest);

      await this.auditLogService.createLog(manager, {
        paymentRequestId: id,
        actionTakenByUserId: approverUserId,
        actionTypeId: ApprovalActionType.APPR_REJECTED,
        previousStatusId: PaymentStatus.APPROVER_REVIEWING,
        newStatusId: PaymentStatus.REJECTED_APPROVER,
        comment: dto.comment,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      });
    });

    await this.redisService.del(`payment_request:payload:${id}`);

    const statusUpdatePayload = {
      paymentRequestId: request.id,
      requestNumber: request.request_number,
      previousStatusId: PaymentStatus.APPROVER_REVIEWING,
      newStatusId: PaymentStatus.REJECTED_APPROVER,
      actionByUserId: approverUserId,
      actionByUserName: approverUser.fullName,
      timestamp: new Date().toISOString(),
    };

    this.websocketGateway.sendPersonalNotification(
      request.applicant_user_id,
      'request:status-changed',
      statusUpdatePayload,
    );

    return {
      success: true,
      message: 'Request successfully rejected and returned to applicant.',
    };
  }
}
