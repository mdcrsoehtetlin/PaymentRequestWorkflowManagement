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
import { ManagerService } from './manager.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MANAGER)
@Controller('manager/payment-requests')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**
   * @description Retrieves pending requests assigned to the logged-in manager.
   * @param req The request containing the JWT payload.
   * @returns A list of pending payment requests.
   * @throws {UnauthorizedException} If user is not authorized.
   */
  @Get('pending-manager')
  async getPendingRequests(@Request() req: { user: JwtPayload }) {
    const managerId = req.user.sub;
    return this.managerService.getPendingRequests(managerId);
  }

  /**
   * @description Verifies a pending payment request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param comment Optional comment for verification.
   * @returns A success status message.
   * @throws {Error} If verification fails.
   */
  @Post(':id/verify')
  verifyRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const managerId = req.user.sub;
    return this.managerService.verifyRequest(id, managerId, comment);
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
  rejectRequest(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment: string,
  ) {
    const managerId = req.user.sub;
    return this.managerService.rejectRequest(id, managerId, comment);
  }
}
