import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [SharedModule],
  controllers: [ManagerController, NotificationController],
  providers: [ManagerService],
})
export class ManagerModule {}
