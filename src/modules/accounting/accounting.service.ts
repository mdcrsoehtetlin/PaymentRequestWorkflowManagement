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
   */
  async findApprovedRequests(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    branch?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    this.logger.log(`Fetching approved requests page ${page} size ${pageSize}`);

    const queryBuilder = this.paymentRequestRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.applicant', 'applicant')
      .where('pr.statusId = :statusId', { statusId: 8 }) // APPROVED
      .andWhere('pr.isDeleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(pr.requestNumber ILIKE :search OR applicant.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (branch) {
      queryBuilder.andWhere('applicant.branch = :branch', { branch });
    }

    if (dateFrom) {
      queryBuilder.andWhere('pr.applicationDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('pr.applicationDate <= :dateTo', { dateTo });
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
        paymentRequestId: req.paymentRequestId,
        requestNumber: req.requestNumber,
        applicantName: req.applicant.fullName,
        branch: req.applicant.branch,
        totalAmount: req.totalAmount,
        currencyCode: req.currencyId === 1 ? 'MMK' : 'USD', // Simplified for boilerplate
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
   */
  async getSummaryCounts() {
    this.logger.log('Fetching summary counts for accounting dashboard');

    const totalApproved = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .where('pr.statusId = :statusId', { statusId: 8 })
      .andWhere('pr.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();

    const pendingToday = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .where('pr.statusId = :statusId', { statusId: 8 })
      .andWhere('pr.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('pr.applicationDate = CURRENT_DATE')
      .getCount();

    const mandalayAlerts = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .leftJoin('pr.applicant', 'applicant')
      .where('pr.statusId = :statusId', { statusId: 8 })
      .andWhere('pr.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('applicant.branch = :branch', { branch: 'Mandalay' })
      .getCount();

    const missingReceipts = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .leftJoin('pr.receiptFiles', 'rf', 'rf.isDeleted = false')
      .where('pr.statusId = :statusId', { statusId: 8 })
      .andWhere('pr.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('pr.hasReceipt = true')
      .andWhere('rf.receiptFileId IS NULL')
      .getCount();

    return {
      totalApproved,
      pendingToday,
      mandalayAlerts,
      missingReceipts,
    };
  }

  /**
   * Retrieves a specific payment request details for accounting review.
   */
  async findOneForAccounting(id: number): Promise<AccountingPaymentDetailDto> {
    this.logger.log(`Fetching details for payment request ${id}`);

    const request = await this.paymentRequestRepository.findOne({
      where: { paymentRequestId: id, statusId: 8, isDeleted: false },
      relations: [
        'applicant',
        'manager',
        'finalApprover',
        'breakdownItems',
        'receiptFiles',
        'approvalLogs',
        'approvalLogs.actionTakenByUser',
      ],
      order: {
        approvalLogs: {
          timestamp: 'ASC',
        },
      },
    });

    if (!request) {
      throw new NotFoundException(
        `Payment request ${id} not found or not in APPROVED state`,
      );
    }

    const activeReceiptFiles = (request.receiptFiles ?? []).filter(
      (file) => !file.isDeleted,
    );

    return {
      paymentRequestId: request.paymentRequestId,
      requestNumber: request.requestNumber,
      statusId: request.statusId,
      hasReceipt: request.hasReceipt,
      applicant: {
        userId: request.applicant.userId,
        fullName: request.applicant.fullName,
        employeeNumber: request.applicant.employeeNumber,
        branch: request.applicant.branch,
        department: request.applicant.department ?? null,
        email: request.applicant.email,
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
      breakdownItems: (request.breakdownItems ?? [])
        .sort((left, right) => left.lineNumber - right.lineNumber)
        .map((item) => ({
          id: item.paymentBreakdownItemId,
          lineNumber: item.lineNumber,
          itemDate: item.itemDate,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity ?? null,
          unitPrice: item.unitPrice ?? null,
        })),
      receiptFiles: activeReceiptFiles.map((file) => ({
        id: file.receiptFileId,
        fileName: file.originalFileName,
        fileUrl: `/uploads/${request.paymentRequestId}/${file.storedFileName}`,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedDate: file.uploadedDate,
      })),
      approvalTimeline: (request.approvalLogs ?? []).map((log) => ({
        id: log.approvalLogId,
        actionTypeId: log.actionTypeId,
        previousStatusId: log.previousStatusId ?? null,
        newStatusId: log.newStatusId ?? null,
        comment: log.comment ?? null,
        timestamp: log.timestamp,
        user: {
          userId: log.actionTakenByUser.userId,
          fullName: log.actionTakenByUser.fullName,
          employeeNumber: log.actionTakenByUser.employeeNumber,
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
          paymentRequestId: id,
          statusId: PaymentStatus.APPROVED,
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
        paymentCompletedDate: new Date(),
      });

      // 4. Write immutable audit log (inside same transaction)
      await this.auditLogService.createLog(manager, {
        paymentRequestId: id,
        actionTakenByUserId: ctx.accountingUserId,
        actionTypeId: ApprovalActionType.PAYMENT_COMPLETED,
        previousStatusId,
        newStatusId: PaymentStatus.PAID,
        comment: ctx.comment ?? null,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
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
