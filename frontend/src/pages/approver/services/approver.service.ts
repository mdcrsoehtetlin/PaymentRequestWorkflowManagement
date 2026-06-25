import apiClient from '../../../services/api-client';
import type { ActionResponse, PaginatedResponse } from '../../../types';
import type {
  ApproverRequestDetailView,
  ApproverRequestListItem,
  ApproverRequestQuery,
} from '../types';

export const approverService = {
  async fetchRequests(query: ApproverRequestQuery) {
    const { data } = await apiClient.get<
      PaginatedResponse<ApproverRequestListItem>
    >('/approver/payment-requests', { params: query });

    return data;
  },

  async fetchSummary() {
    const { data } = await apiClient.get<{
      pendingCount: number;
      reviewingCount: number;
      approvedCount: number;
      rejectedCount: number;
      totalQueue: number;
      desiredDateAlertCount: number;
    }>('/approver/payment-requests/summary');

    return data;
  },

  async fetchRequestDetail(id: number) {
    const { data } = await apiClient.get<ApproverRequestDetailView>(
      `/approver/payment-requests/${id}`,
    );
    return data;
  },

  async approveRequest(
    id: number,
    payload: { comment?: string; accountingUserId?: number },
  ) {
    const { data } = await apiClient.post<ActionResponse>(
      `/approver/payment-requests/${id}/approve`,
      payload,
    );
    return data;
  },

  async rejectRequest(id: number, payload: { comment: string }) {
    const { data } = await apiClient.post<ActionResponse>(
      `/approver/payment-requests/${id}/reject`,
      payload,
    );
    return data;
  },
};
