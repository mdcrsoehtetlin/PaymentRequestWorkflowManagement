import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ManagerService } from './manager.service';

@Controller('payment-requests')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('pending-manager')
  async getPendingRequests() {
    const managerId = 2; // Demo manager user ID
    return this.managerService.getPendingRequests(managerId);
  }

  @Post(':id/verify')
  async verifyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const managerId = 2;
    return this.managerService.verifyRequest(id, managerId, comment);
  }

  @Post(':id/reject-manager')
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment: string,
  ) {
    const managerId = 2;
    return this.managerService.rejectRequest(id, managerId, comment);
  }
}
