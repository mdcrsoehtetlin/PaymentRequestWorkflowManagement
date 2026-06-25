import apiClient from '../../../services/api-client';

export interface PaymentRequest {
  paymentRequestId: number;
  requestNumber: string;
  applicantName: string;
  branch: string;
  totalAmount: string;
  currencyCode: string;
  statusId: number;
  applicationDate: string;
  desiredPaymentDate: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface AccountingBreakdownItem {
  id: number;
  lineNumber: number;
  itemDate: string;
  description: string;
  amount: string;
  quantity: string | null;
  unitPrice: string | null;
}

export interface AccountingReceiptFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  uploadedDate: string;
}

export interface AccountingApprovalTimelineItem {
  id: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  timestamp: string;
  user: {
    userId: number;
    fullName: string;
    employeeNumber: string;
  };
}

export interface AccountingPaymentDetail {
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
    applicationDate: string;
    desiredPaymentDate: string;
  };
  breakdownItems: AccountingBreakdownItem[];
  receiptFiles: AccountingReceiptFile[];
  approvalTimeline: AccountingApprovalTimelineItem[];
}

export const getApprovedRequests = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  branch?: string,
  desiredDate?: string,
  filter?: string,
): Promise<PaginatedResponse<PaymentRequest>> => {
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
  };
  if (search) params.search = search;
  if (branch) params.branch = branch;
  if (desiredDate) params.desiredDate = desiredDate;
  if (filter) params.filter = filter;

  const response = await apiClient.get<PaginatedResponse<PaymentRequest>>(
    '/accounting/payment-requests',
    { params },
  );
  return response.data;
};

export interface SummaryCounts {
  total: number;
  pending: number;
  mandalayAlerts: number;
  desiredDateAlerts: number;
}

export const getSummaryCounts = async (): Promise<SummaryCounts> => {
  const response = await apiClient.get<SummaryCounts>(
    '/accounting/payment-requests/summary',
  );
  return response.data;
};

export const completePayment = async (
  id: number,
  comment?: string,
): Promise<void> => {
  await apiClient.post(`/accounting/payment-requests/${id}/complete-payment`, {
    comment,
  });
};

export const getPaymentRequestDetails = async (
  id: number,
): Promise<AccountingPaymentDetail> => {
  const response = await apiClient.get<AccountingPaymentDetail>(
    `/accounting/payment-requests/${id}`,
  );
  return response.data;
};
