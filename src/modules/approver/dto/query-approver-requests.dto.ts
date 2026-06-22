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
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  showAll?: boolean;

  @IsOptional()
  @IsEnum(ApproverRequestSortFields)
  sortBy?: ApproverRequestSortFields =
    ApproverRequestSortFields.MANAGER_VERIFIED_DATE;
}

import {
  PaymentRequestDetailView,
  PaymentStatus,
  UserSummary,
} from '../../shared/types';

export interface ApproverRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicant: UserSummary;
  manager: UserSummary | null;
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
  canApprove: boolean;
  canReject: boolean;
  latestManagerComment: string | null;
  latestApplicantSubmissionComment: string | null;
}
