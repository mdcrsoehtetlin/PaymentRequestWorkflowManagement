import { useCallback, useState } from 'react';
import type { AxiosError } from 'axios';
import { approverService } from '../services/approver.service';
import type { ApproverRequestDetailView } from '../types';
import type { ApiErrorResponse } from '../../../types';

export function useApproverRequestDetail() {
  const [requestDetail, setRequestDetail] =
    useState<ApproverRequestDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequestDetail = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await approverService.fetchRequestDetail(id);
      setRequestDetail(result);
    } catch (err) {
      setRequestDetail(null);
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || 'Failed to load request details.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRequestDetail = useCallback(() => {
    setRequestDetail(null);
    setError(null);
  }, []);

  return {
    requestDetail,
    isLoading,
    error,
    loadRequestDetail,
    clearRequestDetail,
    setRequestDetail,
  };
}
