import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';

@Injectable()
export class ApplicantService {
  private readonly logger = new Logger(ApplicantService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
  ) {}

  async getMyRequests(userId: number, page = 1, limit = 10, statusId?: number) {
    this.logger.log(`Fetching requests for applicant: ${userId}`);
    const query = this.paymentRequestRepository.createQueryBuilder('request')
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

    return { data, total, page, limit };
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
    this.logger.log(`Submitting request ${id} to manager ${managerId} from user ${userId}`);
    // Update logic placeholder
    return { success: true, message: 'Submitted to manager successfully' };
  }

  async submitToApprover(id: number, userId: number) {
    this.logger.log(`Submitting request ${id} to final approver from user ${userId}`);
    // Update logic placeholder
    return { success: true, message: 'Submitted to approver successfully' };
  }

  async softDeleteDraft(id: number, userId: number) {
    this.logger.log(`Soft deleting draft request ${id} for user ${userId}`);
    // Soft delete logic placeholder
    return { success: true, message: 'Draft soft deleted' };
  }
}
