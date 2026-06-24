import apiClient from '../../../services/api-client';

const API_BASE_URL = '/applicant/payment-requests';

export interface PaymentRequestResponseDto {
  id: string;
  request_number: string;
  status_id: number;
  total_amount: string;
  currency_id: number;
  application_date: string;
  desired_payment_date: string;
  payment_method_id: number;
  has_receipt: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPaymentRequestResponseDto {
  items: PaymentRequestResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardKpiDto {
  total_requests: number;
  pending_review: number;
  approved: number;
  rejected: number;
}

export interface DashboardResponseDto {
  kpis: DashboardKpiDto;
  requests: PaginatedPaymentRequestResponseDto;
}

export const fetchPaymentRequests = async (
  page: number = 1,
  limit: number = 10,
): Promise<DashboardResponseDto> => {
  const response = await apiClient.get<DashboardResponseDto>(API_BASE_URL, {
    params: { page, limit },
  });
  return response.data;
};

export const fetchPaymentRequestDetail = async (
  id: string,
): Promise<unknown> => {
  const response = await apiClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const submitToManager = async (id: string): Promise<unknown> => {
  const response = await apiClient.post(
    `${API_BASE_URL}/${id}/submit-to-manager`,
    { id },
  );
  return response.data;
};

export const uploadReceipt = async (
  id: string,
  file: File,
): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `${API_BASE_URL}/${id}/receipts`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const submitToApprover = async (id: string): Promise<unknown> => {
  const response = await apiClient.post(
    `${API_BASE_URL}/${id}/submit-approver`,
    { id },
  );
  return response.data;
};

export const updatePaymentRequest = async (
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> => {
  const response = await apiClient.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteDraft = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_BASE_URL}/${id}`);
};

export const deleteReceipt = async (
  requestId: string,
  receiptId: string,
): Promise<void> => {
  await apiClient.delete(`${API_BASE_URL}/${requestId}/receipts/${receiptId}`);
};

export const downloadReceipt = async (
  requestId: string,
  receiptId: string,
  fileName: string,
): Promise<void> => {
  const response = await apiClient.get(
    `${API_BASE_URL}/${requestId}/receipts/${receiptId}/download`,
    {
      responseType: 'blob',
    },
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
