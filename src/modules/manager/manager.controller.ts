import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Ip,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { ManagerService } from './manager.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MANAGER)
@Controller('manager/requests')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**
   * @description Retrieves pending requests assigned to the logged-in manager with filters.
   * @param user The logged-in manager from JWT payload.
   * @param query Filters (Status, Date, Applicant Name).
   * @returns A list of pending payment requests.
   */
  @Get()
  async getPendingRequests(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryRequestsDto,
  ) {
    const managerId = user.sub;
    return this.managerService.getPendingRequests(managerId, query);
  }

  /**
   * @description Fetches details of a specific payment request.
   * Triggers an automatic transition to MANAGER_REVIEWING (3) if it's currently SUBMITTED_MANAGER (2).
   */
  @Get(':id')
  async getRequestDetails(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const managerId = user.sub;
    return this.managerService.getRequestDetails(
      id,
      managerId,
      ipAddress,
      userAgent || 'system',
    );
  }

  /**
   * @description Verifies (approves) a pending payment request.
   * @param user The logged-in manager from JWT payload.
   * @param id The ID of the payment request.
   * @param dto The approval payload (modifiedDate, optional comment).
   */
  @Post(':id/approve')
  async verifyRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveRequestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const managerId = user.sub;
    const managerName = user.fullName;
    return this.managerService.verifyRequest(
      id,
      managerId,
      dto,
      ipAddress,
      userAgent || 'system',
      managerName,
    );
  }

  /**
   * @description Rejects a pending payment request with comments.
   * @param user The logged-in manager from JWT payload.
   * @param id The ID of the payment request.
   * @param dto The rejection payload (modifiedDate, required comment >= 10 chars).
   */
  @Post(':id/reject')
  async rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRequestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const managerId = user.sub;
    const managerName = user.fullName;
    return this.managerService.rejectRequest(
      id,
      managerId,
      dto,
      ipAddress,
      userAgent || 'system',
      managerName,
    );
  }
}
