import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantController } from './applicant.controller';
import { ApplicantService } from './applicant.service';
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { PaymentBreakdownItem } from '../shared/entities/payment-breakdown-item.entity';
import { ReceiptFile } from '../shared/entities/receipt-file.entity';
import { ApprovalLog } from '../shared/entities/approval-log.entity';
import { SharedModule } from '../shared/shared.module';
import { ApplicantGateway } from './applicant.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentRequest,
      PaymentBreakdownItem,
      ReceiptFile,
      ApprovalLog,
    ]),
    SharedModule,
    JwtModule.register({}),
  ],
  controllers: [ApplicantController],
  providers: [ApplicantService, ApplicantGateway],
  exports: [ApplicantService, ApplicantGateway],
})
export class ApplicantModule {}
