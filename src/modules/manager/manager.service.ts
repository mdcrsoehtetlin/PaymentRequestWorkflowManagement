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

  async getPendingRequests(managerId: number) {
    this.logger.log(`Fetching pending requests for manager: ${managerId}`);
    return this.paymentRequestRepository.find({
      where: [
        { managerUserId: managerId, statusId: 2 }, // SUBMITTED_MANAGER
        { managerUserId: managerId, statusId: 3 }, // MANAGER_REVIEWING
      ],
      relations: ['applicant'],
    });
  }

  async verifyRequest(id: number, managerId: number, comment?: string) {
    this.logger.log(
      `Verifying request ${id} by manager ${managerId} with comment: ${comment}`,
    );
    // Update status to MANAGER_VERIFIED (4)
    return { success: true, message: 'Request verified successfully' };
  }

  async rejectRequest(id: number, managerId: number, comment: string) {
    this.logger.log(
      `Rejecting request ${id} by manager ${managerId} with comment: ${comment}`,
    );
    // Update status to REJECTED_MANAGER (5)
    return { success: true, message: 'Request rejected successfully' };
  }
}
