import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { CompletePaymentDto } from './dto/accounting-requests.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ACCOUNTING)
@Controller('accounting/payment-requests')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  /**
   * Retrieves paginated approved requests for the accounting dashboard.
   * @param filter KPI filter: 'total' = Approved+Paid, 'pending' = Approved only, 'mandalay' = Mandalay branch, 'desiredDate' = desired date within 3 days
   */
  @Get()
  async getApprovedRequests(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('branch') branch?: string,
    @Query('desiredDate') desiredDate?: string,
    @Query('filter') filter?: string,
    @Query('statusId') statusId?: string,
  ) {
    return this.accountingService.findApprovedRequests(
      page,
      pageSize,
      search,
      branch,
      desiredDate,
      filter,
      statusId ? Number(statusId) : undefined,
    );
  }

  /**
   * Returns summary counts for KPI cards on the accounting dashboard.
   */
  @Get('summary')
  async getSummary() {
    return this.accountingService.getSummaryCounts();
  }

  /**
   * Retrieves a specific payment request details for accounting review.
   */
  @Get(':id')
  async getPaymentRequestDetails(@Param('id', ParseIntPipe) id: number) {
    return this.accountingService.findOneForAccounting(id);
  }

  /**
   * Completes a payment for a request.
   * Extracts IP address and User-Agent from the HTTP request for audit trail.
   */
  @Post(':id/complete-payment')
  @HttpCode(HttpStatus.OK)
  async completePayment(
    @Request()
    req: { user: JwtPayload; ip: string; headers: Record<string, string> },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompletePaymentDto,
  ) {
    return this.accountingService.completePayment(id, {
      accountingUserId: req.user.sub,
      comment: dto.comment,
      ipAddress: req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }
}
