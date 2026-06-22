import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApplicantModule } from './modules/applicant/applicant.module';
import { ManagerModule } from './modules/manager/manager.module';
import { ApproverModule } from './modules/approver/approver.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './modules/shared/guards/jwt-auth.guard';
import { RolesGuard } from './modules/shared/guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: true,
        logging: configService.get<boolean>('database.logging'),
        ssl: configService.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    SharedModule,
    AuthModule,
    ApplicantModule,
    ManagerModule,
    ApproverModule,
    AccountingModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
