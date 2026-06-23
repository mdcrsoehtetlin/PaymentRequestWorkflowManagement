import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Entities
import { User } from './entities/user.entity';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentBreakdownItem } from './entities/payment-breakdown-item.entity';
import { ApprovalLog } from './entities/approval-log.entity';
import { ReceiptFile } from './entities/receipt-file.entity';

// Gateway
import { WebsocketGateway } from './websocket.gateway';

// Services
import { RequestNumberService } from './services/request-number.service';
import { FileUploadService } from './services/file-upload.service';
import { AuditLogService } from './services/audit-log.service';
import { RedisService } from './services/redis.service';

/**
 * @description SharedModule — the foundation layer for all feature modules.
 * Exports: All TypeORM repositories, shared services, and WebSocket gateway.
 *
 * Import this module in every feature module (applicant, manager, etc.)
 * to access entities, shared services, and the WebSocket gateway.
 *
 * Guards, decorators, filters, interceptors, and pipes are registered
 * globally in AppModule via APP_GUARD / APP_INTERCEPTOR / APP_FILTER providers.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      PaymentRequest,
      PaymentBreakdownItem,
      ApprovalLog,
      ReceiptFile,
    ]),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password:
            configService.get<string>('redis.password', '') || undefined,
        });
      },
      inject: [ConfigService],
    },
    WebsocketGateway,
    RequestNumberService,
    FileUploadService,
    AuditLogService,
    RedisService,
  ],
  exports: [
    TypeOrmModule,
    'REDIS_CLIENT',
    WebsocketGateway,
    RequestNumberService,
    FileUploadService,
    AuditLogService,
    RedisService,
  ],
})
export class SharedModule {}
