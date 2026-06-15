import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentBreakdownItem } from './entities/payment-breakdown-item.entity';
import { ApprovalLog } from './entities/approval-log.entity';
import { ReceiptFile } from './entities/receipt-file.entity';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PaymentRequest,
      PaymentBreakdownItem,
      ApprovalLog,
      ReceiptFile,
    ]),
  ],
  providers: [WebsocketGateway],
  exports: [TypeOrmModule, WebsocketGateway],
})
export class SharedModule {}
