import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { ApplicantService } from './applicant.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';

/**
 * @description Controller handling operations for payment requests by the applicant.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.APPLICANT)
@Controller('applicant/payment-requests')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  /**
   * @description Fetches paginated payment requests for the currently authenticated applicant.
   * @param req The HTTP request object containing the JWT payload.
   * @param page The page number for pagination.
   * @param limit The number of items per page.
   * @param statusId Optional filter for request status.
   * @returns A paginated list of payment requests.
   * @throws {UnauthorizedException} If the user is not authenticated.
   */
  @Get('my-requests')
  async getMyRequests(
    @Request() req: { user: JwtPayload },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('statusId') statusId?: number,
  ) {
    const userId = req.user.sub;
    return this.applicantService.getMyRequests(userId, page, limit, statusId);
  }

  /**
   * @description Fetches a specific payment request by ID.
   * @param id The ID of the payment request.
   * @returns The requested payment request.
   * @throws {NotFoundException} If the request is not found.
   */
  @Get(':id')
  async getRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.applicantService.getRequestById(id);
  }

  /**
   * @description Saves a new payment request as a draft.
   * @param req The HTTP request object.
   * @param draftData The data for the draft payment request.
   * @returns The created draft payment request.
   * @throws {BadRequestException} If the provided data is invalid.
   */
  @Post()
  async saveDraft(
    @Request() req: { user: JwtPayload },
    @Body() draftData: CreatePaymentRequestDto,
  ) {
    const userId = req.user.sub;
    return this.applicantService.saveDraft(userId, draftData);
  }

  /**
   * @description Submits a payment request to a manager for review.
   * @param req The HTTP request object.
   * @param id The ID of the payment request.
   * @param managerId The ID of the manager to submit to.
   * @returns A success status message.
   * @throws {NotFoundException} If the request or manager is not found.
   */
  @Post(':id/submit-to-manager')
  async submitToManager(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body('managerId') managerId: number,
  ) {
    const userId = req.user.sub;
    return this.applicantService.submitToManager(id, userId, managerId);
  }

  /**
   * @description Submits a payment request directly to an approver (if applicable).
   * @param req The HTTP request object.
   * @param id The ID of the payment request.
   * @returns A success status message.
   * @throws {NotFoundException} If the request is not found.
   */
  @Post(':id/submit-to-approver')
  async submitToApprover(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.sub;
    return this.applicantService.submitToApprover(id, userId);
  }

  /**
   * @description Soft deletes a draft payment request.
   * @param req The HTTP request object.
   * @param id The ID of the payment request to delete.
   * @returns A success status message.
   * @throws {NotFoundException} If the request is not found.
   */
  @Delete(':id')
  async deleteDraft(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.sub;
    return this.applicantService.softDeleteDraft(id, userId);
  }

  /**
   * @description Updates an existing payment request draft.
   * @param id The ID of the payment request.
   * @param dto The data to update.
   * @returns A success status message.
   * @throws {ConflictException} If there is a lock version mismatch.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentRequestDto,
  ) {
    return this.applicantService.update(id, dto);
  }
}
