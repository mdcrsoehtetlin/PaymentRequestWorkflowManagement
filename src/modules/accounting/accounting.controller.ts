import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('payment-requests')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('pending-payment')
  async getPendingPayments() {
    return this.accountingService.getPendingPayments();
  }

  @Post(':id/complete-payment')
  async completePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const accountingId = 4; // Demo accounting user ID
    return this.accountingService.completePayment(id, accountingId, comment);
  }
}
