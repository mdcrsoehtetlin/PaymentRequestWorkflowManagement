import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../entities/payment-request.entity';

@Injectable()
export class RequestNumberService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly repo: Repository<PaymentRequest>,
  ) {}

  /**
   * Generates next request number in format: PRF-YYYY-NNNNNN
   * Uses MAX query on current year's requests + 1
   */
  async generateNext(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRF-${year}-`;

    const results = await this.repo
      .createQueryBuilder('r')
      .select('r.requestNumber', 'requestNumber')
      .where('r.requestNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawMany();

    let maxSeq = 0;
    for (const row of results as {
      requestNumber?: string;
      request_number?: string;
    }[]) {
      // row.requestNumber or row.request_number based on typeorm raw mapping
      const reqNum = row.requestNumber || row.request_number;
      if (reqNum) {
        const parts = reqNum.split('-');
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }
}
