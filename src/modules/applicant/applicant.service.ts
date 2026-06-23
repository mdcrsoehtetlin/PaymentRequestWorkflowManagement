import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { DashboardResponseDto } from './dto/payment-request-response.dto';
import { DataSource } from 'typeorm';
import { RequestNumberService } from '../shared/services/request-number.service';
import { CreatePaymentRequestDraftDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import { PaymentBreakdownItem } from '../shared/entities/payment-breakdown-item.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { ReceiptFile } from '../shared/entities/receipt-file.entity';
import {
  FileUploadService,
  UploadedFile,
} from '../shared/services/file-upload.service';
import { ApplicantGateway } from './applicant.gateway';

/**
 * Service handling applicant payment request logic
 */
@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepo: Repository<PaymentRequest>,
    @InjectRepository(ReceiptFile)
    private readonly receiptFileRepo: Repository<ReceiptFile>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
    private readonly requestNumberService: RequestNumberService,
    private readonly fileUploadService: FileUploadService,
    private readonly applicantGateway: ApplicantGateway,
  ) {}

  async getDashboardData(
    applicantId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<DashboardResponseDto> {
    const cacheKey = `applicant_dashboard_${applicantId}_${page}_${limit}`;
    const cached = await this.cacheManager.get<DashboardResponseDto>(cacheKey);
    if (cached) return cached;

    const kpiQuery = this.paymentRequestRepo
      .createQueryBuilder('pr')
      .select('pr.status_id', 'status_id')
      .addSelect('COUNT(pr.id)', 'count')
      .where('pr.applicant_user_id = :applicantId', { applicantId })
      .andWhere('pr.is_deleted = false')
      .groupBy('pr.status_id');

    const kpiRaw = await kpiQuery.getRawMany<{
      status_id: number;
      count: string;
    }>();

    const kpis = {
      total_draft: 0,
      total_submitted: 0,
      total_rejected: 0,
      total_approved: 0,
    };

    for (const row of kpiRaw) {
      const statusId = Number(row.status_id);
      const count = Number(row.count);
      if (statusId === 1) kpis.total_draft += count;
      else if (statusId === 2 || statusId === 3) kpis.total_submitted += count;
      else if (statusId === 4) kpis.total_rejected += count;
      else if (statusId === 5 || statusId === 6) kpis.total_approved += count;
    }

    const [items, total] = await this.paymentRequestRepo.findAndCount({
      where: { applicant_user_id: applicantId, is_deleted: false },
      order: { updated_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mappedItems = items.map((item) => ({
      id: item.paymentRequestId,
      request_number: item.requestNumber,
      status_id: item.statusId,
      total_amount: item.totalAmount,
      currency_id: item.currencyId,
      application_date: item.applicationDate,
      desired_payment_date: item.desiredPaymentDate,
      payment_method_id: item.paymentMethodId,
      has_receipt: item.hasReceipt,
      created_at: item.createdDate,
      updated_at: item.modifiedDate,
    }));

    const response: DashboardResponseDto = {
      kpis,
      requests: {
        items: mappedItems,
        total,
        page,
        limit,
      },
    };

    await this.cacheManager.set(cacheKey, response, 300000);
    return response;
  }

  async getPaymentRequestDetail(
    applicantId: number,
    requestId: number,
  ): Promise<PaymentRequest> {
    const request = await this.paymentRequestRepo.findOne({
      where: {
        id: requestId,
        applicant_user_id: applicantId,
        is_deleted: false,
      },
      relations: ['breakdowns', 'receipts', 'logs'],
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    // Sort breakdowns and logs
    if (request.breakdowns)
      request.breakdowns.sort((a, b) => b.amount - a.amount);
    if (request.logs)
      request.logs.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );

    return request;
  }

  async createDraft(
    applicantId: number,
    dto: CreatePaymentRequestDraftDto,
  ): Promise<PaymentRequest> {
    const requestNumber = await this.requestNumberService.generateNext();

    return this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      if (dto.breakdowns) {
        totalAmount = dto.breakdowns.reduce(
          (sum, item) => sum + item.amount,
          0,
        );
      }

      const request = manager.create(PaymentRequest, {
        request_number: requestNumber,
        applicant_user_id: applicantId,
        status_id: 1, // Draft
        total_amount: totalAmount.toString(),
        currency_id: dto.currency_id || 1,
        application_date:
          dto.application_date || new Date().toISOString().split('T')[0],
        desiredPaymentDate:
          dto.desired_payment_date || new Date().toISOString().split('T')[0],
        paymentTypeId: dto.payment_type_id || 1,
        paymentMethodId: dto.payment_method_id || 1,
        purpose: dto.purpose || 'Draft Purpose',
        requestContent: dto.requestContent || 'Draft Content',
      });

      const savedRequest = await manager.save(request);

      if (dto.breakdowns && dto.breakdowns.length > 0) {
        const items = dto.breakdowns.map((b, index) =>
          manager.create(PaymentBreakdownItem, {
            paymentRequestId: savedRequest.paymentRequestId,
            lineNumber: index + 1,
            itemDate:
              dto.application_date || new Date().toISOString().split('T')[0],
            description: b.description,
            amount: b.amount,
          }),
        );
        await manager.save(items);
      }

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.paymentRequestId,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 1,
        newStatusId: 1,
        comment: 'Draft created',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      return savedRequest;
    });
  }

  async submitToManager(
    applicantId: number,
    requestId: number,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: requestId,
          applicant_user_id: applicantId,
          is_deleted: false,
        },
        relations: ['breakdowns', 'receipts'],
      });

      if (!request) throw new NotFoundException('Payment request not found');
      if (![1, 5, 9].includes(request.statusId)) {
        throw new BadRequestException(
          'Only Draft or Rejected requests can be submitted to Manager',
        );
      }

      if (!request.currencyId)
        throw new BadRequestException('Currency is required');
      if (!request.applicationDate)
        throw new BadRequestException('Application date is required');
      if (!request.desiredPaymentDate)
        throw new BadRequestException('Desired payment date is required');
      if (!request.paymentMethodId)
        throw new BadRequestException('Payment method is required');
      if (!request.breakdownItems || request.breakdownItems.length === 0)
        throw new BadRequestException(
          'At least one breakdown item is required',
        );

      const total = request.breakdowns.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      if (total <= 0)
        throw new BadRequestException('Total amount must be greater than 0');

      const previousStatus = request.statusId;
      request.statusId = 2;
      request.hasReceipt = !!(
        request.receiptFiles && request.receiptFiles.length > 0
      );

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.paymentRequestId,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 2,
        previousStatusId: previousStatus,
        newStatusId: 2,
        comment: 'Submitted to Manager',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      this.applicantGateway.notifyStatusUpdate(String(applicantId), {
        paymentRequestId: Number(savedRequest.id),
        requestNumber: savedRequest.request_number,
        previousStatusId: request.status_id,
        newStatusId: 2,
        actionByUserId: Number(applicantId),
        actionByUserName: 'Applicant',
        timestamp: log.timestamp.toISOString(),
      });

      return savedRequest;
    });
  }

  async uploadReceipt(
    applicantId: number,
    requestId: number,
    file: UploadedFile,
  ): Promise<ReceiptFile> {
    const request = await this.paymentRequestRepo.findOne({
      where: {
        id: requestId,
        applicant_user_id: applicantId,
        is_deleted: false,
      },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.statusId !== 1 && request.statusId !== 4) {
      throw new BadRequestException(
        'Receipts can only be uploaded for Draft or Rejected requests',
      );
    }

    const { storedFileName, fileStoragePath } =
      await this.fileUploadService.saveFile(file, requestId);

    const receipt = this.receiptFileRepo.create({
      paymentRequestId: Number(requestId),
      originalFileName: storedFileName,
      storedFileName,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileStoragePath,
      isDeleted: false,
    });

    const savedReceipt = await this.receiptFileRepo.save(receipt);

    await this.paymentRequestRepo.update(
      { paymentRequestId: Number(requestId) },
      { hasReceipt: true },
    );

    await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

    return savedReceipt;
  }

  async submitToApprover(
    applicantId: number,
    requestId: number,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: requestId,
          applicant_user_id: applicantId,
          is_deleted: false,
        },
      });

      if (!request) {
        throw new NotFoundException('Payment request not found');
      }

      if (request.statusId !== 4) {
        throw new BadRequestException(
          'Only Manager-Verified requests can be submitted to Final Approver',
        );
      }

      request.statusId = 6;

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.paymentRequestId,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 3,
        previousStatusId: 4,
        newStatusId: 6,
        comment: 'Submitted to Final Approver',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      this.applicantGateway.notifyStatusUpdate(String(applicantId), {
        paymentRequestId: Number(savedRequest.id),
        requestNumber: savedRequest.request_number,
        previousStatusId: 4,
        newStatusId: 6,
        actionByUserId: Number(applicantId),
        actionByUserName: 'Applicant',
        timestamp: log.timestamp.toISOString(),
      });

      return savedRequest;
    });
  }

  async updatePaymentRequest(
    applicantId: number,
    requestId: number,
    dto: UpdatePaymentRequestDto,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: requestId,
          applicant_user_id: applicantId,
          is_deleted: false,
        },
        relations: ['breakdowns'],
      });

      if (!request) throw new NotFoundException('Payment request not found');

      const editableStatuses = [1, 5, 9];
      if (!editableStatuses.includes(request.statusId)) {
        throw new BadRequestException('Request is not in an editable state');
      }

      if (dto.currency_id !== undefined) request.currencyId = dto.currency_id;
      if (dto.application_date !== undefined)
        request.applicationDate = dto.application_date;
      if (dto.desired_payment_date !== undefined)
        request.desiredPaymentDate = dto.desired_payment_date;
      if (dto.payment_method_id !== undefined)
        request.paymentMethodId = dto.payment_method_id;

      if (dto.breakdowns) {
        await manager.delete(PaymentBreakdownItem, {
          paymentRequestId: Number(requestId),
        });
        const items = dto.breakdowns.map((b, index) =>
          manager.create(PaymentBreakdownItem, {
            paymentRequestId: Number(requestId),
            lineNumber: index + 1,
            itemDate:
              dto.application_date ||
              request.applicationDate ||
              new Date().toISOString().split('T')[0],
            description: b.description,
            amount: b.amount,
          }),
        );
        await manager.save(items);
        request.total_amount = dto.breakdowns
          .reduce((sum, item) => sum + item.amount, 0)
          .toString();
      }

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.paymentRequestId,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 2,
        previousStatusId: request.statusId,
        newStatusId: request.statusId,
        comment: 'Request edited',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      return savedRequest;
    });
  }

  async deleteDraft(applicantId: number, requestId: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: requestId,
          applicant_user_id: applicantId,
          is_deleted: false,
        },
      });

      if (!request) {
        throw new NotFoundException('Payment request not found');
      }

      if (request.statusId !== 1) {
        throw new BadRequestException('Only Draft requests can be deleted');
      }

      request.isDeleted = true;
      await manager.save(request);

      await manager.update(
        ReceiptFile,
        { paymentRequestId: Number(requestId) },
        { isDeleted: true },
      );

      const log = manager.create(ApprovalLog, {
        paymentRequestId: request.paymentRequestId,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 2,
        previousStatusId: 1,
        newStatusId: 1,
        comment: 'Draft deleted',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);
    });
  }
}
