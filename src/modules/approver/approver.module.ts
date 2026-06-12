import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ApproverController } from './approver.controller';
import { ApproverService } from './approver.service';

@Module({
  imports: [SharedModule],
  controllers: [ApproverController],
  providers: [ApproverService],
})
export class ApproverModule {}
