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
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ACCOUNTING)
@Controller('accounting/payment-requests')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  /**
   * @description Retrieves pending payments for the accounting team.
   * @returns A list of approved payment requests ready for payment.
   * @throws {Error} If retrieval fails.
   */
  @Get('pending-payment')
  async getPendingPayments() {
    return this.accountingService.getPendingPayments();
  }

  /**
   * @description Completes a payment for a request.
   * @param req The request containing the JWT payload.
   * @param id The ID of the payment request.
   * @param comment Optional comment for payment completion.
   * @returns A success status message.
   * @throws {Error} If payment update fails.
   */
  @Post(':id/complete-payment')
  async completePayment(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const accountingId = req.user.sub;
    return this.accountingService.completePayment(id, accountingId, comment);
  }
}
