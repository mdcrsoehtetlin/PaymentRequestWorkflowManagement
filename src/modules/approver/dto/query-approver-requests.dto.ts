import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export enum ApproverRequestSortFields {
  CREATED_DATE = 'createdDate',
  APPLICATION_DATE = 'applicationDate',
  DESIRED_PAYMENT_DATE = 'desiredPaymentDate',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'statusId',
  MANAGER_VERIFIED_DATE = 'managerVerificationDate',
  MODIFIED_DATE = 'modifiedDate',
}

export class QueryApproverRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsDateString()
  desiredDate?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  showAll?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  desiredDateAlert?: boolean;

  @IsOptional()
  @IsEnum(ApproverRequestSortFields)
  sortBy?: ApproverRequestSortFields = ApproverRequestSortFields.MODIFIED_DATE;
}

import {
  PaymentRequestDetailView,
  PaymentStatus,
  UserSummary,
} from '../../shared/types';

export interface ApproverUserSummary extends UserSummary {
  department: string;
  email: string;
}

export interface ApproverRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicant: ApproverUserSummary;
  manager: ApproverUserSummary | null;
  applicationDate: string;
  desiredPaymentDate: string;
  totalAmount: string;
  currencyCode: string;
  statusId: PaymentStatus;
  purpose: string;
  managerVerificationDate: string | null;
  submittedToApproverDate: string | null;
  createdDate: string;
}

export interface ApproverRequestDetailView extends PaymentRequestDetailView {
  applicant: ApproverUserSummary;
  manager: ApproverUserSummary | null;
  finalApprover: ApproverUserSummary | null;
  canApprove: boolean;
  canReject: boolean;
  latestManagerComment: string | null;
  latestApplicantSubmissionComment: string | null;
}
