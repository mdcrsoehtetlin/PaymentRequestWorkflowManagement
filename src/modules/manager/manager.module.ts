import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';

@Module({
  imports: [SharedModule],
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}
