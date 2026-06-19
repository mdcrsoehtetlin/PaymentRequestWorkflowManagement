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
  total_draft: number;
  total_submitted: number;
  total_rejected: number;
  total_approved: number;
}

export interface DashboardResponseDto {
  kpis: DashboardKpiDto;
  requests: PaginatedPaymentRequestResponseDto;
}

export const fetchPaymentRequests = async (page: number = 1, limit: number = 10): Promise<DashboardResponseDto> => {
  const response = await apiClient.get<DashboardResponseDto>(API_BASE_URL, {
    params: { page, limit }
  });
  return response.data;
};

export const fetchPaymentRequestDetail = async (id: string): Promise<any> => {
  const response = await apiClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const submitToManager = async (id: string): Promise<any> => {
  const response = await apiClient.post(`${API_BASE_URL}/${id}/submit-manager`, { id });
  return response.data;
};

export const uploadReceipt = async (id: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(`${API_BASE_URL}/${id}/receipts`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitToApprover = async (id: string): Promise<any> => {
  const response = await apiClient.post(`${API_BASE_URL}/${id}/submit-approver`, { id });
  return response.data;
};

export const updatePaymentRequest = async (id: string, data: any): Promise<any> => {
  const response = await apiClient.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteDraft = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_BASE_URL}/${id}`);
};
