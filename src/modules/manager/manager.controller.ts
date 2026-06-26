import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Ip,
  Headers,
  BadRequestException,
  NotFoundException,
  Res,
  Logger,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { StartReviewDto } from './dto/start-review.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MANAGER)
@Controller('manager/requests')
export class ManagerController {
  private readonly logger = new Logger(ManagerController.name);

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
   * @description Fetches details of a specific payment request (read-only, no side effects).
   */
  @Get(':id')
  async getRequestDetails(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const managerId = user.sub;
    return this.managerService.getRequestDetails(id, managerId);
  }

  /**
   * @description Downloads a receipt file for a specific payment request.
   */
  @Get(':id/receipts/:receiptId/download')
  async downloadReceipt(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('receiptId', ParseIntPipe) receiptId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const managerId = user.sub;
    this.logger.log(
      `Downloading receipt ${receiptId} for request ${id} by manager ${managerId}`,
    );

    const receipt = await this.managerService.downloadReceipt(
      managerId,
      id,
      receiptId,
    );

    if (!receipt.storage_key) {
      this.logger.error(
        `Receipt ${receiptId} has no storage_key (file_storage_path)`,
      );
      throw new NotFoundException('領収書ファイルのパスが見つかりません');
    }

    if (!existsSync(receipt.storage_key)) {
      this.logger.error(
        `Receipt file not found on disk: ${receipt.storage_key}`,
      );
      throw new NotFoundException('領収書ファイルがストレージに見つかりません');
    }

    const file = createReadStream(receipt.storage_key);
    res.set({
      'Content-Type': receipt.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(receipt.originalFileName || 'receipt')}"`,
    });
    return new StreamableFile(file);
  }

  /**
   * @description Transitions a request from SUBMITTED_MANAGER to MANAGER_REVIEWING.
   * Called when the manager opens a request detail view for the first time.
   * @param user The logged-in manager from JWT payload.
   * @param id The ID of the payment request.
   * @param dto Contains the client-side modifiedDate for optimistic concurrency check.
   */
  @Patch(':id/review')
  async startReview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StartReviewDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const managerId = user.sub;
    return this.managerService.startReview(
      id,
      managerId,
      dto,
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
    if (!id || id <= 0) {
      throw new BadRequestException('有効な申請IDが指定されていません');
    }
    const managerId = user.sub;
    return this.managerService.verifyRequest(
      id,
      managerId,
      dto,
      ipAddress,
      userAgent || 'system',
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
    if (!id || id <= 0) {
      throw new BadRequestException('有効な申請IDが指定されていません');
    }
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
