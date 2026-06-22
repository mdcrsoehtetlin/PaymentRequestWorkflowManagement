// ============================================================
// src/modules/approver/approver.controller.ts
// REST controller for the Final Approver dashboard workspace.
// Exposes queue listing, detail fetch, approve, and reject endpoints.
// All routes require JWT authentication and APPROVER role (role_id = 3).
// ============================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApproverService } from './approver.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { QueryApproverRequestsDto } from './dto/query-approver-requests.dto';
import { ApprovePaymentRequestDto } from './dto/approve-payment-request.dto';
import { RejectPaymentRequestDto } from './dto/reject-payment-request.dto';

/**
 * @description Controller for the Final Approver dashboard.
 *
 * Provides endpoints for:
 * - Listing pending requests with filters, sorting, and pagination.
 * - Fetching detailed request view with automatic review-start transition.
 * - Approving a request (status → APPROVED, route to Accounting).
 * - Rejecting a request with mandatory comment (status → REJECTED_APPROVER, return to Applicant).
 *
 * All endpoints are guarded by {@link JwtAuthGuard} and {@link RolesGuard}
 * and restricted to the APPROVER role (`role_id = 3`).
 *
 * @see {@link ApproverService} for business logic.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.APPROVER)
@Controller('approver/payment-requests')
export class ApproverController {
  constructor(private readonly approverService: ApproverService) {}

  /**
   * @description Retrieves pending requests assigned to or reviewable by the final approver.
   * @param req The request containing the JWT payload.
   * @param query Filtering, sorting, and pagination parameters.
   * @returns Paginated list of pending requests.
   */
  @Get()
  async getRequests(
    @Request() req: { user: JwtPayload },
    @Query() query: QueryApproverRequestsDto,
  ) {
    const approverUserId = req.user.sub;
    return this.approverService.findAssignedRequests(approverUserId, query);
  }

  /**
   * @description Returns summary counts for the approver dashboard.
   * @param req The request containing the JWT payload.
   * @returns Summary counts of pending, reviewing, and approved requests.
   */
  @Get('summary')
  async getSummary(@Request() req: { user: JwtPayload }) {
    const approverUserId = req.user.sub;
    return this.approverService.getSummary(approverUserId);
  }

  /**
   * @description Fetches details of a specific request for review.
   * Starts review automatically if status is SUBMITTED_APPROVER.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param ipAddress Client's IP address.
   * @param userAgent Client's User Agent.
   * @returns Detailed view of the payment request.
   */
  @Get(':id')
  async getRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const approverUserId = req.user.sub;
    return this.approverService.findOneForReview(id, approverUserId, {
      ipAddress,
      userAgent: userAgent || 'unknown',
    });
  }

  /**
   * @description Approves a payment request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param dto The approval parameters including comment.
   * @param ipAddress Client's IP address.
   * @param userAgent Client's User Agent.
   * @returns Success response.
   */
  @Post(':id/approve')
  async approveRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApprovePaymentRequestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const approverUserId = req.user.sub;
    return this.approverService.approve(id, approverUserId, dto, {
      ipAddress,
      userAgent: userAgent || 'unknown',
    });
  }

  /**
   * @description Rejects a payment request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param dto The rejection comment payload.
   * @param ipAddress Client's IP address.
   * @param userAgent Client's User Agent.
   * @returns Success response.
   */
  @Post(':id/reject')
  async rejectRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPaymentRequestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const approverUserId = req.user.sub;
    return this.approverService.reject(id, approverUserId, dto, {
      ipAddress,
      userAgent: userAgent || 'unknown',
    });
  }
}
