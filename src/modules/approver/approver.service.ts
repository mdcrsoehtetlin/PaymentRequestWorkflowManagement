import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';

@Injectable()
export class ApproverService {
  private readonly logger = new Logger(ApproverService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
  ) {}

  async getPendingRequests() {
    this.logger.log('Fetching pending requests for final approver');
    return this.paymentRequestRepository.find({
      where: [
        { statusId: 6 }, // SUBMITTED_APPROVER
        { statusId: 7 }, // APPROVER_REVIEWING
      ],
      relations: ['applicant'],
    });
  }

  async approveRequest(id: number, approverId: number, comment?: string) {
    this.logger.log(
      `Approving request ${id} by approver ${approverId} with comment: ${comment}`,
    );
    // Update status to APPROVED (8)
    return { success: true, message: 'Request approved successfully' };
  }

  async rejectRequest(id: number, approverId: number, comment: string) {
    this.logger.log(
      `Rejecting request ${id} by approver ${approverId} with comment: ${comment}`,
    );
    // Update status to REJECTED_APPROVER (9)
    return { success: true, message: 'Request rejected by final approver' };
  }
}
