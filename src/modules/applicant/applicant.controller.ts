import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApplicantService } from './applicant.service';

@Controller('payment-requests')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Get('my-requests')
  async getMyRequests(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('statusId') statusId?: number,
  ) {
    // Assuming hardcoded user ID 1 for boilerplate demonstration
    const userId = 1;
    return this.applicantService.getMyRequests(userId, page, limit, statusId);
  }

  @Post()
  async saveDraft(@Body() draftData: any) {
    const userId = 1;
    return this.applicantService.saveDraft(userId, draftData);
  }

  @Post(':id/submit-manager')
  async submitToManager(
    @Param('id', ParseIntPipe) id: number,
    @Body('managerId') managerId: number,
  ) {
    const userId = 1;
    return this.applicantService.submitToManager(id, userId, managerId);
  }

  @Post(':id/submit-approver')
  async submitToApprover(@Param('id', ParseIntPipe) id: number) {
    const userId = 1;
    return this.applicantService.submitToApprover(id, userId);
  }

  @Delete(':id')
  async deleteDraft(@Param('id', ParseIntPipe) id: number) {
    const userId = 1;
    return this.applicantService.softDeleteDraft(id, userId);
  }
}
