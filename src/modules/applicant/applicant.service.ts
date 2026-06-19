import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { FileUploadService, UploadedFile } from '../shared/services/file-upload.service';
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

  async getDashboardData(applicantId: string, page: number = 1, limit: number = 10): Promise<DashboardResponseDto> {
    const cacheKey = `applicant_dashboard_${applicantId}_${page}_${limit}`;
    const cached = await this.cacheManager.get<DashboardResponseDto>(cacheKey);
    if (cached) return cached;

    const kpiQuery = this.paymentRequestRepo.createQueryBuilder('pr')
      .select('pr.status_id', 'status_id')
      .addSelect('COUNT(pr.id)', 'count')
      .where('pr.applicant_id = :applicantId', { applicantId })
      .andWhere('pr.is_deleted = false')
      .groupBy('pr.status_id');
      
    const kpiRaw = await kpiQuery.getRawMany();
    
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
      where: { applicant_id: applicantId, is_deleted: false },
      order: { updated_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: DashboardResponseDto = {
      kpis,
      requests: {
        items,
        total,
        page,
        limit,
      }
    };

    await this.cacheManager.set(cacheKey, response, 300000);
    return response;
  }

  async getPaymentRequestDetail(applicantId: string, requestId: string): Promise<PaymentRequest> {
    const request = await this.paymentRequestRepo.findOne({
      where: { id: requestId, applicant_id: applicantId, is_deleted: false },
      relations: ['breakdowns', 'receipts', 'logs']
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    // Sort breakdowns and logs
    if (request.breakdowns) request.breakdowns.sort((a, b) => Number(b.amount) - Number(a.amount));
    if (request.logs) request.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return request;
  }

  async createDraft(applicantId: string, dto: CreatePaymentRequestDraftDto): Promise<PaymentRequest> {
    const requestNumber = await this.requestNumberService.generateNext();
    
    return this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      if (dto.breakdowns) {
        totalAmount = dto.breakdowns.reduce((sum, item) => sum + item.amount, 0);
      }

      const request = manager.create(PaymentRequest, {
        request_number: requestNumber,
        applicant_id: applicantId,
        status_id: 1, // Draft
        total_amount: totalAmount.toString(),
        currency_id: dto.currency_id || 1,
        application_date: dto.application_date || new Date().toISOString().split('T')[0],
        desired_payment_date: dto.desired_payment_date || new Date().toISOString().split('T')[0],
        payment_type_id: dto.payment_type_id || 1,
        payment_method_id: dto.payment_method_id || 1,
        purpose: dto.purpose || 'Draft Purpose',
        request_content: dto.request_content || 'Draft Content',
      });

      const savedRequest = await manager.save(request);

      if (dto.breakdowns && dto.breakdowns.length > 0) {
        const items = dto.breakdowns.map((b, index) => manager.create(PaymentBreakdownItem, {
          payment_request_id: savedRequest.id,
          line_number: index + 1,
          item_date: dto.application_date || new Date().toISOString().split('T')[0],
          description: b.description,
          amount: b.amount.toString(),
        }));
        await manager.save(items);
      }

      const log = manager.create(ApprovalLog, {
        payment_request_id: savedRequest.id,
        action_taken_by_user_id: applicantId,
        action_type_id: 1, // Created
        new_status_id: 1,
        comment: 'Draft created',
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
      await manager.save(log);

      // Invalidate the first page cache to reflect the new draft
      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      return savedRequest;
    });
  }

  async submitToManager(applicantId: string, requestId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: { id: requestId, applicant_id: applicantId, is_deleted: false },
        relations: ['breakdowns', 'receipts']
      });

      if (!request) throw new NotFoundException('Payment request not found');
      if (![1, 5, 9].includes(request.status_id)) {
        throw new BadRequestException('Only Draft or Rejected requests can be submitted to Manager');
      }

      // Strict validation
      if (!request.currency_id) throw new BadRequestException('Currency is required');
      if (!request.application_date) throw new BadRequestException('Application date is required');
      if (!request.desired_payment_date) throw new BadRequestException('Desired payment date is required');
      if (!request.payment_method_id) throw new BadRequestException('Payment method is required');
      if (!request.breakdowns || request.breakdowns.length === 0) throw new BadRequestException('At least one breakdown item is required');
      
      const total = request.breakdowns.reduce((sum, item) => sum + Number(item.amount), 0);
      if (total <= 0) throw new BadRequestException('Total amount must be greater than 0');

      // State transition
      request.status_id = 2; // Submitted (Manager)
      request.has_receipt = request.receipts && request.receipts.length > 0;
      
      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        payment_request_id: savedRequest.id,
        action_taken_by_user_id: applicantId,
        action_type_id: 2, // Submitted
        previous_status_id: request.status_id,
        new_status_id: 2,
        comment: 'Submitted to Manager',
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      this.applicantGateway.notifyStatusUpdate(applicantId, {
        paymentRequestId: savedRequest.id as any,
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

  async uploadReceipt(applicantId: string, requestId: string, file: UploadedFile): Promise<ReceiptFile> {
    const request = await this.paymentRequestRepo.findOne({
      where: { id: requestId, applicant_id: applicantId, is_deleted: false }
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.status_id !== 1 && request.status_id !== 4) {
      throw new BadRequestException('Receipts can only be uploaded for Draft or Rejected requests');
    }

    const { storedFileName, fileStoragePath } = await this.fileUploadService.saveFile(file, requestId);

    const receipt = this.receiptFileRepo.create({
      payment_request_id: requestId,
      file_name: storedFileName,
      file_size: file.size,
      mime_type: file.mimetype,
      storage_key: fileStoragePath,
      is_deleted: false,
    });

    const savedReceipt = await this.receiptFileRepo.save(receipt);

    // Update has_receipt flag
    await this.paymentRequestRepo.update(requestId, { has_receipt: true });
    
    // Invalidate cache
    await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

    return savedReceipt;
  }

  async submitToApprover(applicantId: string, requestId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: { id: requestId, applicant_id: applicantId, is_deleted: false },
      });

      if (!request) {
        throw new NotFoundException('Payment request not found');
      }

      if (request.status_id !== 4) { // MANAGER_VERIFIED
        throw new BadRequestException('Only Manager-Verified requests can be submitted to Final Approver');
      }

      // State transition
      request.status_id = 6; // SUBMITTED_APPROVER
      
      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        payment_request_id: savedRequest.id,
        action_taken_by_user_id: applicantId,
        action_type_id: 3, // SUBMITTED (using 3 as general submit action type)
        previous_status_id: 4,
        new_status_id: 6,
        comment: 'Submitted to Final Approver',
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      this.applicantGateway.notifyStatusUpdate(applicantId, {
        paymentRequestId: savedRequest.id as any,
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

  async updatePaymentRequest(applicantId: string, requestId: string, dto: UpdatePaymentRequestDto): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: { id: requestId, applicant_id: applicantId, is_deleted: false },
        relations: ['breakdowns']
      });

      if (!request) throw new NotFoundException('Payment request not found');
      
      const editableStatuses = [1, 5, 9]; // DRAFT, REJECTED_MANAGER, REJECTED_APPROVER
      if (!editableStatuses.includes(request.status_id)) {
        throw new BadRequestException('Request is not in an editable state');
      }

      // Update fields
      if (dto.currency_id !== undefined) request.currency_id = dto.currency_id;
      if (dto.application_date !== undefined) request.application_date = dto.application_date;
      if (dto.desired_payment_date !== undefined) request.desired_payment_date = dto.desired_payment_date;
      if (dto.payment_method_id !== undefined) request.payment_method_id = dto.payment_method_id;

      if (dto.breakdowns) {
        await manager.delete(PaymentBreakdownItem, { payment_request_id: requestId });
        const items = dto.breakdowns.map((b, index) => manager.create(PaymentBreakdownItem, {
          payment_request_id: requestId,
          line_number: index + 1,
          item_date: dto.application_date || request.application_date || new Date().toISOString().split('T')[0],
          description: b.description,
          amount: b.amount.toString(),
        }));
        await manager.save(items);
        request.total_amount = dto.breakdowns.reduce((sum, item) => sum + Number(item.amount), 0).toString();
      }

      const savedRequest = await manager.save(request);

      const log = manager.create(ApprovalLog, {
        payment_request_id: savedRequest.id,
        action_taken_by_user_id: applicantId,
        action_type_id: 2, // EDITED
        previous_status_id: request.status_id,
        new_status_id: request.status_id,
        comment: 'Request edited',
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);

      return savedRequest;
    });
  }

  async deleteDraft(applicantId: string, requestId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: { id: requestId, applicant_id: applicantId, is_deleted: false },
      });

      if (!request) {
        throw new NotFoundException('Payment request not found');
      }

      if (request.status_id !== 1) {
        throw new BadRequestException('Only Draft requests can be deleted');
      }

      request.is_deleted = true;
      await manager.save(request);

      await manager.update(ReceiptFile, { payment_request_id: requestId }, { is_deleted: true });

      const log = manager.create(ApprovalLog, {
        payment_request_id: request.id,
        action_taken_by_user_id: applicantId,
        action_type_id: 2, // General edit/update action type since no deleted type exists
        previous_status_id: 1,
        new_status_id: 1,
        comment: 'Draft deleted',
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
      await manager.save(log);

      await this.cacheManager.del(`applicant_dashboard_${applicantId}_1_10`);
    });
  }
}
