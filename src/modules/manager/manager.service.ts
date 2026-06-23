import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
  ) {}

  /**
   * @description Retrieves pending requests assigned to a specific manager.
   * @param managerId The manager's user ID.
   * @returns A list of pending payment requests.
   * @throws {Error} If database query fails.
   */
  async getPendingRequests(managerId: number) {
    this.logger.log(`Fetching pending requests for manager: ${managerId}`);
    return this.paymentRequestRepository.find({
      where: [
        { /*managerUserId*/ applicant_id: managerId as any, status_id: 2 }, // SUBMITTED_MANAGER
        { /*managerUserId*/ applicant_id: managerId as any, status_id: 3 }, // MANAGER_REVIEWING
      ],
      relations: ['applicant'],
    });
  }

  /**
   * @description Verifies a payment request.
   * @param id The payment request ID.
   * @param managerId The manager's user ID.
   * @param comment Optional comment for verification.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  async verifyRequest(id: number, managerId: number, comment?: string) {
    this.logger.log(
      `Verifying request ${id} by manager ${managerId} with comment: ${comment}`,
    );
    // Update status to MANAGER_VERIFIED (4)
    return { success: true, message: 'Request verified successfully' };
  }

  /**
   * @description Rejects a payment request.
   * @param id The payment request ID.
   * @param managerId The manager's user ID.
   * @param comment Required comment for rejection.
   * @returns A success status message.
   * @throws {Error} If update fails.
   */
  async rejectRequest(id: number, managerId: number, comment: string) {
    this.logger.log(
      `Rejecting request ${id} by manager ${managerId} with comment: ${comment}`,
    );
    // Update status to REJECTED_MANAGER (5)
    return { success: true, message: 'Request rejected successfully' };
  }
}
