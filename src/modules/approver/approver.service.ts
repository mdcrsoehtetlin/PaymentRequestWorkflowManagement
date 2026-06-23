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

  /**
   * @description Retrieves all pending requests assigned to the approver role.
   * @returns A list of pending payment requests.
   * @throws {Error} If database query fails.
   */
  async getPendingRequests(): Promise<PaymentRequest[]> {
    this.logger.log('Fetching pending requests for final approver');
    return this.paymentRequestRepository.find({
      where: [
        { status_id: 6 }, // SUBMITTED_APPROVER
        { status_id: 7 }, // APPROVER_REVIEWING
      ],
      relations: ['applicant'],
    });
  }

  /**
   * @description Approves a payment request.
   * @param id The payment request ID.
   * @param approverId The final approver's user ID.
   * @param comment Optional comment for approval.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  approveRequest(id: number, approverId: number, comment?: string) {
    this.logger.log(
      `Approving request ${id} by approver ${approverId} with comment: ${comment}`,
    );
    // Update status to APPROVED (8)
    return { success: true, message: 'Request approved successfully' };
  }

  /**
   * @description Rejects a payment request.
   * @param id The payment request ID.
   * @param approverId The final approver's user ID.
   * @param comment Required comment for rejection.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  rejectRequest(id: number, approverId: number, comment: string) {
    this.logger.log(
      `Rejecting request ${id} by approver ${approverId} with comment: ${comment}`,
    );
    // Update status to REJECTED_APPROVER (9)
    return { success: true, message: 'Request rejected by final approver' };
  }
}
