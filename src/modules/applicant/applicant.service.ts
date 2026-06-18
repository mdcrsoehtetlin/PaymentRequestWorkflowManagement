import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, OptimisticLockVersionMismatchError } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { AuditLogService } from '../shared/services/audit-log.service';
import { buildPaginationMeta } from '../shared/utils/pagination.util';
import { ApprovalActionType, PaymentStatus } from '../shared/types';

@Injectable()
export class ApplicantService {
  private readonly logger = new Logger(ApplicantService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

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

  async getRequestById(id: number) {
    this.logger.log(`Fetching request ${id}`);
    const request = await this.paymentRequestRepository.findOne({
      where: { paymentRequestId: id, isDeleted: false },
      relations: ['applicant', 'breakdownItems'],
    });
    return request;
  }

  async saveDraft(userId: number, draftData: any) {
    this.logger.log(`Saving draft for applicant: ${userId}`);
    const request = this.paymentRequestRepository.create({
      ...draftData,
      applicantUserId: userId,
      statusId: 1, // DRAFT
    });
    return this.paymentRequestRepository.save(request);
  }

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

  async softDeleteDraft(id: number, userId: number) {
    this.logger.log(`Soft deleting draft request ${id} for user ${userId}`);
    await this.paymentRequestRepository.update(id, { isDeleted: true });
    return { success: true, message: 'Draft soft deleted' };
  }

  async update(id: number, dto: any) {
    this.logger.log(`Updating request ${id}`);
    try {
      const request = await this.paymentRequestRepository.findOneBy({ paymentRequestId: id });
      if (!request) {
        throw new ConflictException('Request not found');
      }
      
      Object.assign(request, dto);
      await this.paymentRequestRepository.save(request);
      
      return { success: true, message: 'Request updated successfully' };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('この申請は他のユーザーによって更新されました');
      }
      throw error;
    }
  }
}
