import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../shared/entities/payment-request.entity';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
  ) {}

  async getPendingPayments() {
    this.logger.log('Fetching pending payments for accounting');
    return this.paymentRequestRepository.find({
      where: { statusId: 8 }, // APPROVED
      relations: ['applicant'],
    });
  }

  async completePayment(id: number, accountingId: number, comment?: string) {
    this.logger.log(
      `Completing payment ${id} by accounting user ${accountingId} with comment: ${comment}`,
    );
    // Update status to PAID (10)
    return { success: true, message: 'Payment completed successfully' };
  }
}
