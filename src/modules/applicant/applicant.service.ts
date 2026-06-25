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
import { User } from '../shared/entities/user.entity';
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
    private readonly requestNumberService: RequestNumberService,
    private readonly fileUploadService: FileUploadService,
    private readonly applicantGateway: ApplicantGateway,
  ) {}

  async getActiveManagers(): Promise<
    { userId: number; fullName: string; department: string }[]
  > {
    return this.userRepo.find({
      select: ['userId', 'fullName', 'department'],
      where: {
        roleId: 2, // MANAGER
        isActive: true,
      },
    });
  }

  async getDashboardData(
    applicantId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    statusId?: number,
    startDate?: string,
    endDate?: string,
    minAmount?: number,
    maxAmount?: number,
    branch?: string,
    desiredDate?: string,
  ): Promise<DashboardResponseDto> {
    const cacheKey = `applicant_dashboard_${applicantId}_${page}_${limit}_${search || ''}_${statusId || ''}_${startDate || ''}_${endDate || ''}_${minAmount || ''}_${maxAmount || ''}_${branch || ''}_${desiredDate || ''}`;
    const cached = await this.cacheManager.get<DashboardResponseDto>(cacheKey);
    if (cached) return cached;

    const kpiQuery = this.paymentRequestRepo
      .createQueryBuilder('pr')
      .select('pr.status_id', 'status_id')
      .addSelect('COUNT(pr.id)', 'count')
      .where('pr.applicant_user_id = :applicantId', { applicantId })
      .andWhere('pr.is_deleted = false');

    if (search) {
      kpiQuery.andWhere('pr.request_number ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (startDate) {
      kpiQuery.andWhere('pr.application_date >= :startDate', { startDate });
    }
    if (endDate) {
      kpiQuery.andWhere('pr.application_date <= :endDate', { endDate });
    }
    if (minAmount !== undefined) {
      kpiQuery.andWhere('pr.total_amount >= :minAmount', { minAmount });
    }
    if (maxAmount !== undefined) {
      kpiQuery.andWhere('pr.total_amount <= :maxAmount', { maxAmount });
    }
    if (branch) {
      kpiQuery
        .innerJoin('pr.applicant', 'applicantUser')
        .andWhere('applicantUser.branch = :branch', { branch });
    }
    if (desiredDate) {
      kpiQuery.andWhere('pr.desired_payment_date = :desiredDate', {
        desiredDate,
      });
    }

    kpiQuery.groupBy('pr.status_id');

    const kpiRaw = await kpiQuery.getRawMany<{
      status_id: number;
      count: string;
    }>();

    const kpis = {
      total_requests: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
    };

    for (const row of kpiRaw) {
      const rowStatusId = Number(row.status_id);
      const count = Number(row.count);
      kpis.total_requests += count;
      if ([2, 3, 6, 7].includes(rowStatusId)) kpis.pending_review += count;
      else if ([8, 10].includes(rowStatusId)) kpis.approved += count;
      else if ([5, 9].includes(rowStatusId)) kpis.rejected += count;
    }

    const query = this.paymentRequestRepo
      .createQueryBuilder('pr')
      .where('pr.applicant_user_id = :applicantId', { applicantId })
      .andWhere('pr.is_deleted = false');

    if (search) {
      query.andWhere('pr.request_number ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (statusId) {
      query.andWhere('pr.status_id = :statusId', { statusId });
    }
    if (startDate) {
      query.andWhere('pr.application_date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('pr.application_date <= :endDate', { endDate });
    }
    if (minAmount !== undefined) {
      query.andWhere('pr.total_amount >= :minAmount', { minAmount });
    }
    if (maxAmount !== undefined) {
      query.andWhere('pr.total_amount <= :maxAmount', { maxAmount });
    }

    // Branch filter requires join if branch is on user.
    if (branch) {
      query
        .innerJoin('pr.applicant', 'applicantUser')
        .andWhere('applicantUser.branch = :branch', { branch });
    }
    if (desiredDate) {
      query.andWhere('pr.desired_payment_date = :desiredDate', { desiredDate });
    }

    const [items, total] = await query
      .orderBy('pr.modifiedDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const mappedItems = items.map((item) => ({
      id: item.id,
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
        applicantUserId: applicantId,
        isDeleted: false,
      },
      relations: ['breakdowns', 'receipts', 'approvalLogs'],
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    // Sort breakdowns and approvalLogs
    if (request.breakdowns)
      request.breakdowns.sort((a, b) => b.amount - a.amount);
    if (request.approvalLogs)
      request.approvalLogs.sort(
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
        requestNumber: requestNumber,
        applicantUserId: applicantId,
        statusId: 1, // Draft
        totalAmount: totalAmount.toString(),
        currencyId: dto.currency_id || 1,
        applicationDate:
          dto.application_date || new Date().toISOString().split('T')[0],
        desiredPaymentDate:
          dto.desired_payment_date || new Date().toISOString().split('T')[0],
        paymentTypeId: dto.payment_type_id || 1,
        paymentMethodId: dto.payment_method_id || 1,
        managerUserId: dto.target_manager_id || null,
        purpose: dto.purpose || '',
        requestContent: dto.request_content || '',
        hasReceipt: dto.has_receipt || false,
        bankAccountInfo: dto.bank_account_info || null,
      });

      const savedRequest = await manager.save(request);

      if (dto.breakdowns && dto.breakdowns.length > 0) {
        const items = dto.breakdowns.map((b, index) =>
          manager.create(PaymentBreakdownItem, {
            payment_request_id: savedRequest.id,
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
        paymentRequestId: savedRequest.id,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 1, // CREATED
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
          applicantUserId: applicantId,
          isDeleted: false,
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
      if (!request.paymentTypeId)
        throw new BadRequestException('Payment type is required');
      if (!request.purpose || !request.purpose.trim())
        throw new BadRequestException('Purpose is required');
      if (!request.requestContent || !request.requestContent.trim())
        throw new BadRequestException('Payment request content is required');
      if (!request.managerUserId)
        throw new BadRequestException('Target manager must be selected');
      if (!request.breakdowns || request.breakdowns.length === 0)
        throw new BadRequestException(
          'At least one breakdown item is required',
        );

      const total = request.breakdowns.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      if (total <= 0)
        throw new BadRequestException('Total amount must be greater than 0');

      if (request.hasReceipt) {
        const activeReceipts =
          request.receipts?.filter((r) => !r.isDeleted) || [];
        if (activeReceipts.length === 0) {
          throw new BadRequestException(
            'At least one receipt file must be attached when Receipt Present is Yes',
          );
        }
      }

      const previousStatus = request.statusId;
      request.statusId = 2;

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.id,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 3, // SUBMITTED
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
        requestNumber: savedRequest.requestNumber,
        previousStatusId: request.statusId,
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
        applicantUserId: applicantId,
        isDeleted: false,
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

    const nameRegex = /^.+_\d{8}_\d+\.(pdf|png|jpg|jpeg)$/i;
    if (!nameRegex.test(file.originalname)) {
      throw new BadRequestException(
        'File name must follow the format {Description}_{YYYYMMDD}_{Seq}.{ext} (e.g., Taxi_20231025_01.pdf)',
      );
    }

    const { storedFileName, fileStoragePath } =
      await this.fileUploadService.saveFile(file, requestId);

    const receipt = this.receiptFileRepo.create({
      paymentRequestId: Number(requestId),
      originalFileName: file.originalname,
      storedFileName,
      file_size: file.size,
      mime_type: file.mimetype,
      storage_key: fileStoragePath,
      isDeleted: false,
    });

    const savedReceipt = await this.receiptFileRepo.save(receipt);

    await this.paymentRequestRepo.update(
      { id: Number(requestId) },
      { hasReceipt: true },
    );

    await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

    return savedReceipt;
  }

  async downloadReceipt(
    applicantId: number,
    requestId: number,
    receiptId: number,
  ): Promise<ReceiptFile> {
    const request = await this.paymentRequestRepo.findOne({
      where: { id: requestId, applicantUserId: applicantId, isDeleted: false },
    });
    if (!request) throw new NotFoundException('Payment request not found');

    const receipt = await this.receiptFileRepo.findOne({
      where: { id: receiptId, paymentRequestId: requestId, isDeleted: false },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    return receipt;
  }

  async deleteReceipt(
    applicantId: number,
    requestId: number,
    receiptId: number,
  ): Promise<void> {
    const request = await this.paymentRequestRepo.findOne({
      where: { id: requestId, applicantUserId: applicantId, isDeleted: false },
    });
    if (!request) throw new NotFoundException('Payment request not found');

    if (request.statusId !== 1 && request.statusId !== 4) {
      throw new BadRequestException(
        'Receipts can only be deleted for Draft or Rejected requests',
      );
    }

    const receipt = await this.receiptFileRepo.findOne({
      where: { id: receiptId, paymentRequestId: requestId, isDeleted: false },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    await this.receiptFileRepo.update({ id: receiptId }, { isDeleted: true });

    // Check if there are any remaining receipts
    const remaining = await this.receiptFileRepo.count({
      where: { paymentRequestId: requestId, isDeleted: false },
    });
    if (remaining === 0) {
      await this.paymentRequestRepo.update(
        { id: requestId },
        { hasReceipt: false },
      );
    }

    await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);
  }

  async submitToApprover(
    applicantId: number,
    requestId: number,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: {
          id: requestId,
          applicantUserId: applicantId,
          isDeleted: false,
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
        paymentRequestId: savedRequest.id,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 3, // SUBMITTED
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
        requestNumber: savedRequest.requestNumber,
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
          applicantUserId: applicantId,
          isDeleted: false,
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
      if (dto.payment_type_id !== undefined)
        request.paymentTypeId = dto.payment_type_id;
      if (dto.target_manager_id !== undefined)
        request.managerUserId = dto.target_manager_id;
      if (dto.purpose !== undefined) request.purpose = dto.purpose;
      if (dto.request_content !== undefined)
        request.requestContent = dto.request_content;
      if (dto.bank_account_info !== undefined)
        request.bankAccountInfo = dto.bank_account_info;
      if (dto.has_receipt !== undefined) request.hasReceipt = dto.has_receipt;

      if (dto.breakdowns) {
        await manager.delete(PaymentBreakdownItem, {
          payment_request_id: Number(requestId),
        });
        const items = dto.breakdowns.map((b, index) =>
          manager.create(PaymentBreakdownItem, {
            payment_request_id: Number(requestId),
            lineNumber: index + 1,
            itemDate:
              dto.application_date ||
              request.applicationDate ||
              new Date().toISOString().split('T')[0],
            description: b.description,
            amount: b.amount,
          }),
        );
        request.breakdowns = items;
        request.totalAmount = dto.breakdowns
          .reduce((sum, item) => sum + item.amount, 0)
          .toString();
      }

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        paymentRequestId: savedRequest.id,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 2, // EDITED
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
          applicantUserId: applicantId,
          isDeleted: false,
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
        paymentRequestId: request.id,
        actionTakenByUserId: Number(applicantId),
        actionTypeId: 2, // EDITED (soft-delete action)
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
