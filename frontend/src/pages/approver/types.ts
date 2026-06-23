import type {
  UserSummary,
  PaymentRequestDetailView,
} from '../../types';
import {
  PaymentStatus,
  ApprovalActionType,
} from '../../types';

export type { PaymentBreakdownItem } from '../../types';

export interface ApproverRequestQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  statusId?: number;
  search?: string;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
  showAll?: boolean;
}

export interface ApproverRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicant: UserSummary;
  manager: UserSummary | null;
  applicationDate: string;
  desiredPaymentDate: string;
  totalAmount: string;
  currencyCode: string;
  statusId: number;
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

export const STATUS_LABELS_EN: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: 'Draft',
  [PaymentStatus.SUBMITTED_MANAGER]: 'Submitted to Manager',
  [PaymentStatus.MANAGER_REVIEWING]: 'Manager Reviewing',
  [PaymentStatus.MANAGER_VERIFIED]: 'Manager Verified',
  [PaymentStatus.REJECTED_MANAGER]: 'Rejected by Manager',
  [PaymentStatus.SUBMITTED_APPROVER]: 'Submitted to Approver',
  [PaymentStatus.APPROVER_REVIEWING]: 'Approver Reviewing',
  [PaymentStatus.APPROVED]: 'Approved',
  [PaymentStatus.REJECTED_APPROVER]: 'Rejected by Approver',
  [PaymentStatus.PAID]: 'Paid',
};

export const ACTION_LABELS_EN: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: 'Created',
  [ApprovalActionType.EDITED]: 'Edited',
  [ApprovalActionType.SUBMITTED]: 'Submitted',
  [ApprovalActionType.MGR_REVIEW_START]: 'Manager Review Started',
  [ApprovalActionType.MGR_VERIFIED]: 'Manager Verified',
  [ApprovalActionType.MGR_REJECTED]: 'Rejected by Manager',
  [ApprovalActionType.APPR_REVIEW_START]: 'Approver Review Started',
  [ApprovalActionType.APPROVED]: 'Approved',
  [ApprovalActionType.APPR_REJECTED]: 'Rejected by Approver',
  [ApprovalActionType.PAYMENT_COMPLETED]: 'Payment Completed',
};
