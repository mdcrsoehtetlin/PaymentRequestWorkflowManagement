import { useCallback, useState } from 'react';
import { approverService } from '../services/approver.service';
import type { ApproverRequestDetailView } from '../../../types';

export function useApproverRequestDetail() {
  const [requestDetail, setRequestDetail] = useState<ApproverRequestDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRequestDetail = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const result = await approverService.fetchRequestDetail(id);
      setRequestDetail(result);
    } catch {
      setRequestDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRequestDetail = useCallback(() => setRequestDetail(null), []);

  return {
    requestDetail,
    isLoading,
    loadRequestDetail,
    clearRequestDetail,
    setRequestDetail,
  };
}
