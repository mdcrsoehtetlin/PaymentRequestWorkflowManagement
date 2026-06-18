import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApproverService } from './approver.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.APPROVER)
@Controller('approver/payment-requests')
export class ApproverController {
  constructor(private readonly approverService: ApproverService) {}

  /**
   * @description Retrieves pending requests assigned to the approver.
   * @returns A list of pending payment requests.
   * @throws {Error} If retrieval fails.
   */
  @Get('pending-approver')
  async getPendingRequests() {
    return this.approverService.getPendingRequests();
  }

  /**
   * @description Approves a pending payment request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param comment Optional comment for approval.
   * @returns A success status message.
   * @throws {Error} If approval fails.
   */
  @Post(':id/approve')
  async approveRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const approverId = req.user.sub;
    return this.approverService.approveRequest(id, approverId, comment);
  }

  /**
   * @description Rejects a pending payment request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param comment The required comment for rejection.
   * @returns A success status message.
   * @throws {Error} If rejection fails.
   */
  @Post(':id/reject')
  async rejectRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment: string,
  ) {
    const approverId = req.user.sub;
    return this.approverService.rejectRequest(id, approverId, comment);
  }
}
