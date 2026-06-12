import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
