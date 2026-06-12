import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';

@Module({
  imports: [SharedModule],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
