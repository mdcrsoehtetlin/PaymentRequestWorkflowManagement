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
      user: JwtPayload;
      params: { id: string };
      paymentRequest?: PaymentRequest;
    }>();
    const user: JwtPayload = request.user;
    const userId = user.sub;
    const requestId = parseInt(request.params.id, 10);

    if (!requestId) return true;

    const paymentRequest = await this.repo.findOne({
      where: { paymentRequestId: requestId, isDeleted: false },
    });

    if (!paymentRequest) {
      throw new NotFoundException('指定された申請が見つかりません');
    }
    if (paymentRequest.applicantUserId !== userId) {
      throw new ForbiddenException('この操作を実行する権限がありません');
    }

    request.paymentRequest = paymentRequest;
    return true;
  }
}
