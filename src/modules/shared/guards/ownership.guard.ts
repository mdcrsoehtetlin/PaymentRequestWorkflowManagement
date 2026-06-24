import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from '../entities/payment-request.entity';
import { JwtPayload } from '../types';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly repo: Repository<PaymentRequest>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      params: Record<string, string>;
      paymentRequest?: PaymentRequest;
    }>();
    const user = request.user;
    const userId = user?.sub;
    const requestId = parseInt(request.params.id, 10);

    if (!requestId) return true;

    const paymentRequest = await this.repo.findOne({
      where: { id: requestId, isDeleted: false },
    });

    if (!paymentRequest) {
      throw new NotFoundException('The specified request could not be found');
    }
    if (paymentRequest.applicantUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to perform this operation',
      );
    }

    request.paymentRequest = paymentRequest;
    return true;
  }
}
