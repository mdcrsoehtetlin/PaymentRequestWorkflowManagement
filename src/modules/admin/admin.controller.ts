import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  async createUser(@Body() userData: any) {
    return this.adminService.createUser(userData);
  }

  @Patch('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: number,
  ) {
    return this.adminService.getAuditLogs(startDate, endDate, userId);
  }
}
