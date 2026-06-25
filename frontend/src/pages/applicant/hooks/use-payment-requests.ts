import { useState, useCallback, useEffect } from 'react';
import { fetchPaymentRequests, deleteDraft } from '../services/api';
import type { DashboardResponseDto } from '../services/api';

/**
 * @description Hook to manage payment requests fetching, pagination, and deletion.
 * @param {number} limit - Number of items per page.
 * @param {string | null} externalUpdateTrigger - Used to re-fetch data when an external update (like websocket) happens.
 * @returns {Object} State and handlers for dashboard data.
 */
export const usePaymentRequests = (
  limit: number = 10,
  externalUpdateTrigger: unknown = null,
  filters: Omit<
    import('../services/api').FetchPaymentRequestsParams,
    'page' | 'limit'
  > = {},
) => {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // We need to keep a stable reference to filters to avoid infinite loops,
  // or use JSON.stringify(filters) as a dependency.
  const filterKey = JSON.stringify(filters);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const parsedFilters = JSON.parse(filterKey);
      const result = await fetchPaymentRequests({
        page,
        limit,
        ...parsedFilters,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData, externalUpdateTrigger]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await deleteDraft(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete draft', error);
      alert('Failed to delete draft');
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    page,
    setPage,
    deleteId,
    setDeleteId,
    handleDelete,
    loadData,
  };
};
