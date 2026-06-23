import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Body DTO validated from the HTTP request body */
export class CompletePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

/** Internal context object carrying validated identity + request metadata */
export interface CompletePaymentContext {
  accountingUserId: number;
  comment?: string;
  ipAddress: string;
  userAgent: string;
}

export interface AccountingBreakdownItemDto {
  id: number;
  lineNumber: number;
  itemDate: Date | string;
  description: string;
  amount: string;
  quantity: string | null;
  unitPrice: string | null;
}

export interface AccountingReceiptFileDto {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  uploadedDate: Date;
}

export interface AccountingApprovalTimelineItemDto {
  id: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  timestamp: Date;
  user: {
    userId: number;
    fullName: string;
    employeeNumber: string;
  };
}

export interface AccountingPaymentDetailDto {
  paymentRequestId: number;
  requestNumber: string;
  statusId: number;
  hasReceipt: boolean;
  applicant: {
    userId: number;
    fullName: string;
    employeeNumber: string;
    branch: string;
    department: string | null;
    email: string;
  };
  paymentDetails: {
    totalAmount: string;
    currencyCode: string;
    paymentTypeName: string;
    paymentMethodName: string;
    purpose: string;
    requestContent: string;
    bankAccountInfo: string | null;
    applicationDate: Date | string;
    desiredPaymentDate: Date | string;
  };
  breakdownItems: AccountingBreakdownItemDto[];
  receiptFiles: AccountingReceiptFileDto[];
  approvalTimeline: AccountingApprovalTimelineItemDto[];
}
