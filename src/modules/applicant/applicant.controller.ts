import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicantService } from './applicant.service';
import { DashboardResponseDto } from './dto/payment-request-response.dto';
import { CreatePaymentRequestDraftDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode } from '../shared/types';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
    branch: string;
    employeeNumber: string;
  };
}

export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Controller for Applicant Dashboard endpoints
 */
@Controller('applicant/payment-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.APPLICANT)
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Get()
  async getPaymentRequests(
    @Req() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<DashboardResponseDto> {
    const applicantId = Number(req.user.sub);
    return this.applicantService.getDashboardData(
      applicantId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async getPaymentRequestDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const applicantId = Number(req.user.sub);
    const request = await this.applicantService.getPaymentRequestDetail(
      applicantId,
      Number(id),
    );

    return {
      id: request.id,
      request_number: request.requestNumber,
      status_id: request.statusId,
      currency_id: request.currencyId,
      application_date: request.applicationDate,
      desired_payment_date: request.desiredPaymentDate,
      payment_method_id: request.paymentMethodId,
      payment_type_id: request.paymentTypeId,
      purpose: request.purpose,
      request_content: request.requestContent,
      target_manager_id: request.managerUserId,
      bank_account_info: request.bankAccountInfo,
      total_amount: request.totalAmount,
      has_receipt: request.hasReceipt,
      created_at: request.createdDate,
      updated_at: request.modifiedDate,
      breakdowns: request.breakdowns?.map((b) => ({
        id: b.id,
        description: b.description,
        amount: b.amount,
      })),
      receipts: request.receipts?.map((r) => ({
        id: r.id,
        file_name: r.originalFileName,
        file_size: r.file_size,
      })),
      logs: request.approvalLogs?.map((l) => ({
        id: l.approvalLogId,
        comment: l.comment,
        new_status_id: l.newStatusId,
        timestamp: l.timestamp,
      })),
    };
  }

  @Post('draft')
  async createDraft(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentRequestDraftDto,
  ) {
    const applicantId = Number(req.user.sub);
    const request = await this.applicantService.createDraft(applicantId, dto);
    return {
      message: 'Draft created successfully',
      data: {
        id: request.id,
        request_number: request.requestNumber,
      },
    };
  }

  @Post(':id/receipts')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file: IUploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const applicantId = Number(req.user.sub);
    const receipt = await this.applicantService.uploadReceipt(
      applicantId,
      Number(id),
      file,
    );

    return {
      message: 'Receipt uploaded successfully',
      data: {
        id: receipt.id,
        file_name: receipt.originalFileName,
        file_size: receipt.file_size,
      },
    };
  }

  @Post(':id/submit-to-manager')
  async submitToManager(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const applicantId = Number(req.user.sub);
    const request = await this.applicantService.submitToManager(
      applicantId,
      Number(id),
    );
    return {
      message: 'Request submitted to Manager successfully',
      data: {
        id: request.id,
        status_id: request.statusId,
      },
    };
  }

  @Post(':id/submit-approver')
  async submitToApprover(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const applicantId = Number(req.user.sub);
    const request = await this.applicantService.submitToApprover(
      applicantId,
      Number(id),
    );
    return {
      message: 'Request submitted to Final Approver successfully',
      data: {
        id: request.id,
        statusId: request.statusId,
      },
    };
  }

  @Put(':id')
  async updatePaymentRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentRequestDto,
  ) {
    const applicantId = Number(req.user.sub);
    const request = await this.applicantService.updatePaymentRequest(
      applicantId,
      Number(id),
      dto,
    );
    return {
      message: 'Payment request updated successfully',
      data: {
        id: request.id,
        statusId: request.statusId,
        totalAmount: request.totalAmount,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraft(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const applicantId = Number(req.user.sub);
    await this.applicantService.deleteDraft(applicantId, Number(id));
  }
}
