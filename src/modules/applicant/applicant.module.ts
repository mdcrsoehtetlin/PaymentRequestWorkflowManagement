import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ApplicantController } from './applicant.controller';
import { ApplicantService } from './applicant.service';

@Module({
  imports: [SharedModule],
  controllers: [ApplicantController],
  providers: [ApplicantService],
})
export class ApplicantModule {}
