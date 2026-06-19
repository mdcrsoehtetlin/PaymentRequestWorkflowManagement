import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  EntityManager,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { PaymentBreakdownItem } from '../shared/entities/payment-breakdown-item.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { AuditLogService } from '../shared/services/audit-log.service';
import { buildPaginationMeta } from '../shared/utils/pagination.util';
import { ApprovalActionType, PaymentStatus } from '../shared/types';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
@Injectable()
export class ApplicantService {
  private readonly logger = new Logger(ApplicantService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * @description Retrieves paginated requests for the applicant.
   * @param userId The ID of the applicant.
   * @param page The current page number.
   * @param limit The number of items per page.
   * @param statusId Optional status filter.
   * @returns Paginated payment requests with meta data.
   * @throws {Error} If database query fails.
   */
  async getMyRequests(userId: number, page = 1, limit = 10, statusId?: number) {
    this.logger.log(`Fetching requests for applicant: ${userId}`);
    const query = this.paymentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('request.applicantUserId = :userId', { userId })
      .andWhere('request.isDeleted = false');

    if (statusId) {
      query.andWhere('request.statusId = :statusId', { statusId });
    }

    const [data, total] = await query
      .orderBy('request.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * @description Retrieves a specific payment request by its ID.
   * @param id The payment request ID.
   * @returns The requested payment request with breakdown items.
   * @throws {Error} If database query fails.
   */
  async getRequestById(id: number) {
    this.logger.log(`Fetching request ${id}`);
    const request = await this.paymentRequestRepository.findOne({
      where: { paymentRequestId: id, isDeleted: false },
      relations: ['applicant', 'breakdownItems'],
    });
    return request;
  }

  /**
   * @description Saves a new draft payment request.
   * @param userId The applicant's user ID.
   * @param draftData The payment request details to save.
   * @returns The created payment request entity.
   * @throws {Error} If saving fails.
   */
  async saveDraft(userId: number, draftData: CreatePaymentRequestDto) {
    this.logger.log(`Saving draft for applicant: ${userId}`);
    const request = this.paymentRequestRepository.create({
      ...draftData,
      totalAmount: draftData.totalAmount?.toString(),
      breakdownItems: draftData.breakdownItems?.map((item) => ({
        ...item,
        amount: item.amount?.toString(),
        quantity: item.quantity?.toString(),
        unitPrice: item.unitPrice?.toString(),
      })) as unknown as PaymentBreakdownItem[],
      applicantUserId: userId,
      statusId: 1, // DRAFT
    });
    return this.paymentRequestRepository.save(request);
  }

  /**
   * @description Submits a draft request to a specified manager for review.
   * @param id The payment request ID.
   * @param userId The applicant's user ID.
   * @param managerId The manager's user ID.
   * @returns A success status message.
   * @throws {Error} If transaction fails.
   */
  async submitToManager(id: number, userId: number, managerId: number) {
    this.logger.log(
      `Submitting request ${id} to manager ${managerId} from user ${userId}`,
    );

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Update PaymentRequest
      await manager.update(PaymentRequest, id, {
        statusId: PaymentStatus.SUBMITTED_MANAGER,
        managerUserId: managerId,
        submittedToManagerDate: new Date(),
      });

      // 2. Create ApprovalLog
      const log = manager.create(ApprovalLog, {
        paymentRequestId: id,
        actionTakenByUserId: userId,
        actionTypeId: ApprovalActionType.SUBMITTED,
        previousStatusId: PaymentStatus.DRAFT,
        newStatusId: PaymentStatus.SUBMITTED_MANAGER,
        comment: 'Submitted to manager',
        ipAddress: '127.0.0.1', // Placeholder
        userAgent: 'system', // Placeholder
      });
      await manager.save(log);

      return { success: true, message: 'Submitted to manager successfully' };
    });
  }

  /**
   * @description Submits a verified request to the final approver.
   * @param id The payment request ID.
   * @param userId The applicant's user ID.
   * @returns A success status message.
   * @throws {Error} If transaction fails.
   */
  async submitToApprover(id: number, userId: number) {
    this.logger.log(
      `Submitting request ${id} to final approver from user ${userId}`,
    );
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.update(PaymentRequest, id, {
        statusId: PaymentStatus.SUBMITTED_APPROVER,
        submittedToApproverDate: new Date(),
      });

      const log = manager.create(ApprovalLog, {
        paymentRequestId: id,
        actionTakenByUserId: userId,
        actionTypeId: ApprovalActionType.SUBMITTED,
        previousStatusId: PaymentStatus.MANAGER_VERIFIED,
        newStatusId: PaymentStatus.SUBMITTED_APPROVER,
        comment: 'Submitted to approver',
        ipAddress: '127.0.0.1', // Placeholder
        userAgent: 'system', // Placeholder
      });
      await manager.save(log);

      return { success: true, message: 'Submitted to approver successfully' };
    });
  }

  /**
   * @description Soft deletes a draft payment request.
   * @param id The payment request ID.
   * @param userId The applicant's user ID.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  async softDeleteDraft(id: number, userId: number) {
    this.logger.log(`Soft deleting draft request ${id} for user ${userId}`);
    await this.paymentRequestRepository.update(id, { isDeleted: true });
    return { success: true, message: 'Draft soft deleted' };
  }

  /**
   * @description Updates an existing payment request.
   * @param id The payment request ID.
   * @param dto The data to update.
   * @returns A success status message.
   * @throws {ConflictException} If the request is not found or locked.
   */
  async update(id: number, dto: UpdatePaymentRequestDto) {
    this.logger.log(`Updating request ${id}`);
    try {
      const request = await this.paymentRequestRepository.findOneBy({
        paymentRequestId: id,
      });
      if (!request) {
        throw new ConflictException('Request not found');
      }

      const { breakdownItems, totalAmount, ...rest } = dto;
      Object.assign(request, rest);
      if (totalAmount !== undefined)
        request.totalAmount = totalAmount.toString();
      if (breakdownItems) {
        request.breakdownItems = breakdownItems.map((item) => ({
          ...item,
          amount: item.amount?.toString(),
          quantity: item.quantity?.toString(),
          unitPrice: item.unitPrice?.toString(),
        })) as unknown as PaymentBreakdownItem[];
      }
      await this.paymentRequestRepository.save(request);

      return { success: true, message: 'Request updated successfully' };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'この申請は他のユーザーによって更新されました',
        );
      }
      throw error;
    }
  }
}
