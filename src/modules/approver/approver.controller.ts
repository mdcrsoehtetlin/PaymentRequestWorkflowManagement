import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApproverService } from './approver.service';

@Controller('payment-requests')
export class ApproverController {
  constructor(private readonly approverService: ApproverService) {}

  @Get('pending-approver')
  async getPendingRequests() {
    return this.approverService.getPendingRequests();
  }

  @Post(':id/approve')
  async approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const approverId = 3; // Demo final approver user ID
    return this.approverService.approveRequest(id, approverId, comment);
  }

  @Post(':id/reject-approver')
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment: string,
  ) {
    const approverId = 3;
    return this.approverService.rejectRequest(id, approverId, comment);
  }
}
