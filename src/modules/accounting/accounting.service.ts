import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Redis } from 'ioredis';

// Entities
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { PaymentBreakdownItem } from '../shared/entities/payment-breakdown-item.entity';
import { ReceiptFile } from '../shared/entities/receipt-file.entity';

// Shared services / types
import { AuditLogService } from '../shared/services/audit-log.service';
import { WebsocketGateway } from '../shared/websocket.gateway';
import {
  ApprovalActionType,
  Currency,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  RoleCode,
} from '../shared/types';

// DTO
import {
  AccountingPaymentDetailDto,
  CompletePaymentContext,
} from './dto/accounting-requests.dto';

const CURRENCY_CODE_BY_ID: Record<number, string> = {
  [Currency.MMK]: 'MMK',
  [Currency.USD]: 'USD',
  [Currency.JPY]: 'JPY',
  [Currency.THB]: 'THB',
};

const PAYMENT_TYPE_BY_ID: Record<number, string> = {
  [PaymentType.EXPENSE_REIMBURSE]: 'Expense Reimbursement',
  [PaymentType.SERVICE_PAYMENT]: 'Service Payment',
  [PaymentType.ADVANCE_PAYMENT]: 'Advance Payment',
  [PaymentType.OTHER]: 'Other',
};

const PAYMENT_METHOD_BY_ID: Record<number, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CHECK]: 'Check',
};

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly wsGateway: WebsocketGateway,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Retrieves paginated approved requests for the accounting dashboard.
   * @param filter KPI filter: 'total' = Approved+Paid, 'pending' = Approved only, 'mandalay' = Mandalay branch, 'desiredDate' = desired date within 3 days
   */
  async findApprovedRequests(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    branch?: string,
    desiredDate?: string,
    filter?: string,
    statusId?: number,
  ) {
    this.logger.log(
      `Fetching approved requests page ${page} size ${pageSize} filter=${filter ?? 'none'} statusId=${statusId ?? 'none'}`,
    );

    const queryBuilder = this.paymentRequestRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.applicant', 'applicant');

    // Apply status filter: explicit statusId takes priority over KPI filter
    if (statusId) {
      queryBuilder.where('pr.status_id = :statusId', { statusId });
    } else if (filter === 'total') {
      queryBuilder.where('pr.status_id IN (:...statusIds)', {
        statusIds: [8, 10],
      });
    } else if (filter === 'mandalay') {
      queryBuilder
        .where('pr.status_id = :statusId', { statusId: 8 })
        .andWhere('applicant.branch = :branch', { branch: 'Mandalay' });
    } else if (filter === 'desiredDate') {
      queryBuilder
        .where('pr.status_id = :statusId', { statusId: 8 })
        .andWhere(
          "pr.desired_payment_date <= CURRENT_DATE + INTERVAL '3 days'",
        );
    } else {
      // default: pending (status 8 only)
      queryBuilder.where('pr.status_id = :statusId', { statusId: 8 });
    }

    queryBuilder.andWhere('pr.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(pr.request_number ILIKE :search OR applicant.full_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (branch) {
      queryBuilder.andWhere('applicant.branch = :branch', { branch });
    }

    if (desiredDate) {
      queryBuilder.andWhere('pr.desired_payment_date = :desiredDate', {
        desiredDate,
      });
    }

    // Sort: desired_payment_date ASC, application_date ASC, request_number ASC
    queryBuilder
      .orderBy('pr.desiredPaymentDate', 'ASC')
      .addOrderBy('pr.applicationDate', 'ASC')
      .addOrderBy('pr.requestNumber', 'ASC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: data.map((req) => ({
        paymentRequestId: Number(req.id),
        requestNumber: req.requestNumber,
        applicantName: req.applicant.fullName,
        branch: req.applicant.branch,
        totalAmount: req.totalAmount,
        currencyCode: req.currencyId === 1 ? 'MMK' : 'USD',
        statusId: req.statusId,
        applicationDate: req.applicationDate,
        desiredPaymentDate: req.desiredPaymentDate,
      })),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Returns summary counts for KPI cards.
   * total             = Approved (8) + Paid (10)
   * pending           = Approved (8) only — awaiting payment
   * mandalayAlerts    = Approved (8) + branch Mandalay
   * desiredDateAlerts = Approved (8) + desired_payment_date is overdue or within 3 days
   */
  async getSummaryCounts() {
    this.logger.log('Fetching summary counts for accounting dashboard');

    const total = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .where('pr.status_id IN (:...statusIds)', { statusIds: [8, 10] })
      .andWhere('pr.is_deleted = :isDeleted', { isDeleted: false })
      .getCount();

    const pending = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .where('pr.status_id = :statusId', { statusId: 8 })
      .andWhere('pr.is_deleted = :isDeleted', { isDeleted: false })
      .getCount();

    const mandalayAlerts = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .leftJoin('pr.applicant', 'applicant')
      .where('pr.status_id = :statusId', { statusId: 8 })
      .andWhere('pr.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('applicant.branch = :branch', { branch: 'Mandalay' })
      .getCount();

    const desiredDateAlerts = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .where('pr.status_id = :statusId', { statusId: 8 })
      .andWhere('pr.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere("pr.desired_payment_date <= CURRENT_DATE + INTERVAL '3 days'")
      .getCount();

    return {
      total,
      pending,
      mandalayAlerts,
      desiredDateAlerts,
    };
  }

  /**
   * Retrieves a specific payment request details for accounting review.
   */
  async findOneForAccounting(id: number): Promise<AccountingPaymentDetailDto> {
    this.logger.log(`Fetching details for payment request ${id}`);

    let request;
    try {
      request = await this.paymentRequestRepository
        .createQueryBuilder('pr')
        .leftJoinAndSelect('pr.applicant', 'applicant')
        .leftJoinAndSelect('pr.manager', 'manager')
        .leftJoinAndSelect('pr.finalApprover', 'finalApprover')
        .leftJoin('pr.breakdowns', 'breakdowns')
        .addSelect([
          'breakdowns.id',
          'breakdowns.lineNumber',
          'breakdowns.itemDate',
          'breakdowns.description',
          'breakdowns.amount',
          'breakdowns.quantity',
          'breakdowns.unit_price',
        ])
        .leftJoin('pr.receipts', 'receipts')
        .addSelect([
          'receipts.id',
          'receipts.originalFileName',
          'receipts.storedFileName',
          'receipts.file_size',
          'receipts.mime_type',
          'receipts.uploadedDate',
          'receipts.is_deleted',
        ])
        .leftJoinAndSelect('pr.approvalLogs', 'approvalLogs')
        .leftJoinAndSelect('approvalLogs.action_taken_by_user', 'actionUser')
        .where('pr.payment_request_id = :id', { id: Number(id) })
        .andWhere('pr.status_id IN (:...statusIds)', { statusIds: [8, 10] })
        .andWhere('pr.is_deleted = :isDeleted', { isDeleted: false })
        .orderBy('approvalLogs.timestamp', 'ASC')
        .getOne();
    } catch (err) {
      this.logger.error(
        `QueryBuilder error for payment request ${id}: ${String(err)}`,
      );
      throw err;
    }

    if (!request) {
      this.logger.warn(
        `Payment request ${id} not found (status in [8,10], isDeleted=false)`,
      );
      throw new NotFoundException(
        `Payment request ${id} not found or not in APPROVED/PAID state`,
      );
    }

    this.logger.log(`Found payment request ${id}: ${request.requestNumber}`);

    const breakdowns: PaymentBreakdownItem[] = Array.isArray(request.breakdowns)
      ? request.breakdowns
      : [];
    const allReceipts: ReceiptFile[] = Array.isArray(request.receipts)
      ? request.receipts
      : [];
    const activeReceiptFiles = allReceipts.filter((file) => !file.isDeleted);
    const approvalLogs: ApprovalLog[] = Array.isArray(request.approvalLogs)
      ? request.approvalLogs
      : [];

    return {
      paymentRequestId: Number(request.id),
      requestNumber: request.requestNumber,
      statusId: request.statusId,
      hasReceipt: request.hasReceipt,
      applicant: {
        userId: Number(request.applicantUserId),
        fullName: request.applicant?.fullName ?? 'Unknown',
        employeeNumber: request.applicant?.employeeNumber ?? 'N/A',
        branch: request.applicant?.branch ?? 'Unknown',
        department: request.applicant?.department ?? null,
        email: request.applicant?.email ?? '',
      },
      paymentDetails: {
        totalAmount: request.totalAmount,
        currencyCode: CURRENCY_CODE_BY_ID[request.currencyId] ?? 'UNKNOWN',
        paymentTypeName: PAYMENT_TYPE_BY_ID[request.paymentTypeId] ?? 'Unknown',
        paymentMethodName:
          PAYMENT_METHOD_BY_ID[request.paymentMethodId] ?? 'Unknown',
        purpose: request.purpose,
        requestContent: request.requestContent,
        bankAccountInfo: request.bankAccountInfo ?? null,
        applicationDate: request.applicationDate,
        desiredPaymentDate: request.desiredPaymentDate,
      },
      breakdownItems: breakdowns
        .sort((left, right) => left.lineNumber - right.lineNumber)
        .map((item) => ({
          id: Number(item.id),
          lineNumber: item.lineNumber,
          itemDate: item.itemDate,
          description: item.description,
          amount: String(item.amount),
          quantity: item.quantity != null ? String(item.quantity) : null,
          unitPrice: item.unit_price != null ? String(item.unit_price) : null,
        })),
      receiptFiles: activeReceiptFiles.map((file) => ({
        id: Number(file.id),
        fileName: file.originalFileName,
        fileUrl: `/uploads/${request.id}/${file.storedFileName}`,
        fileSize: String(file.file_size),
        mimeType: file.mime_type,
        uploadedDate: file.uploadedDate,
      })),
      approvalTimeline: approvalLogs.map((log) => ({
        id: log.approvalLogId,
        actionTypeId: log.actionTypeId,
        previousStatusId: log.previousStatusId ?? null,
        newStatusId: log.newStatusId ?? null,
        comment: log.comment ?? null,
        timestamp: log.timestamp,
        user: {
          userId: log.action_taken_by_user
            ? Number(log.action_taken_by_user.userId)
            : 0,
          fullName: log.action_taken_by_user?.fullName ?? 'Unknown',
          employeeNumber: log.action_taken_by_user?.employeeNumber ?? 'N/A',
        },
      })),
    };
  }

  /**
   * Atomically marks a request as PAID, writes an immutable audit log,
   * evicts the Redis cache entry, and broadcasts the WebSocket row-removed event.
   */
  async completePayment(
    id: number,
    ctx: CompletePaymentContext,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Completing payment ${id} by accounting user ${ctx.accountingUserId}`,
    );

    await this.dataSource.transaction(async (manager) => {
      // 1. Lock and fetch the request inside the transaction
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: Number(id),
          statusId: Number(PaymentStatus.APPROVED),
          isDeleted: false,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) {
        throw new NotFoundException(
          `Payment request ${id} not found or not in APPROVED state`,
        );
      }

      // 2. Guard: payment_completed is a terminal state — cannot re-process
      if (request.statusId === Number(PaymentStatus.PAID)) {
        throw new ConflictException(
          `Payment request ${id} has already been marked as PAID`,
        );
      }

      const previousStatusId = request.statusId;

      // 3. Update the payment request fields atomically
      await manager.update(PaymentRequest, id, {
        statusId: PaymentStatus.PAID,
        accountingUserId: ctx.accountingUserId,
        paymentCompletedDate: new Date().toISOString().split('T')[0],
      });

      // 4. Write immutable audit log (inside same transaction)
      const auditLog = manager.create(ApprovalLog, {
        paymentRequestId: id,
        actionTakenByUserId: ctx.accountingUserId,
        actionTypeId: ApprovalActionType.PAYMENT_COMPLETED,
        previousStatusId,
        newStatusId: PaymentStatus.PAID,
        comment: ctx.comment ?? undefined,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      await manager.save(ApprovalLog, auditLog);
    });

    // 5. Redis cache eviction (outside transaction — best effort)
    try {
      await this.redis.del(`payment_request:payload:${id}`);
      this.logger.log(
        `Redis cache evicted for key payment_request:payload:${id}`,
      );
    } catch (err) {
      this.logger.warn(
        `Redis eviction failed for request ${id}: ${String(err)}`,
      );
    }

    // 6. WebSocket: broadcast statusUpdate and row-removed to ACCOUNTING room
    try {
      this.wsGateway.sendStatusUpdate(RoleCode.ACCOUNTING, {
        event: 'statusUpdate',
        paymentRequestId: id,
        previousStatusId: PaymentStatus.APPROVED,
        newStatusId: PaymentStatus.PAID,
        timestamp: new Date().toISOString(),
      });
      this.wsGateway.sendStatusUpdate(RoleCode.ACCOUNTING, {
        event: 'row-removed',
        paymentRequestId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.warn(
        `WebSocket broadcast failed for request ${id}: ${String(err)}`,
      );
    }

    return { success: true, message: 'Payment completed successfully' };
  }
}
