import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../entities/payment-request.entity';

@Injectable()
export class RequestNumberService {
  constructor(
    @(InjectRepository(PaymentRequest) as ParameterDecorator)
    private readonly repo: Repository<PaymentRequest>,
  ) {}

  /**
   * Generates next request number in format: PRF-YYYY-NNNNNN
   * Uses MAX query on current year's requests + 1
   */
  async generateNext(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRF-${year}-`;

    const result = await this.repo
      .createQueryBuilder('r')
      .select('MAX(r.requestNumber)', 'maxNum')
      .where('r.requestNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne<{ maxNum: string | null }>();

    let nextSeq = 1;
    if (result?.maxNum) {
      const currentSeq = parseInt(result.maxNum.split('-')[2], 10);
      nextSeq = currentSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }
}
