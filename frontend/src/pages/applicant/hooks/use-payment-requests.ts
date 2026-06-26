import React, { useState, useCallback, useEffect } from 'react';
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
  const [data, setData] = useState<DashboardResponseDto | null>(() => {
    const saved = sessionStorage.getItem('applicant_dashboard_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !sessionStorage.getItem('applicant_dashboard_data');
  });
  const [page, setPage] = useState<number>(() => {
    const saved = sessionStorage.getItem('applicant_dashboard_page');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('applicant_dashboard_page', page.toString());
  }, [page]);

  useEffect(() => {
    if (data) {
      sessionStorage.setItem('applicant_dashboard_data', JSON.stringify(data));
    }
  }, [data]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // We need to keep a stable reference to filters to avoid infinite loops,
  // or use JSON.stringify(filters) as a dependency.
  const filterKey = JSON.stringify(filters);

  const loadData = useCallback(
    async (forceRefresh: boolean = false, silentRefresh: boolean = false) => {
      try {
        if (!silentRefresh) setLoading(true);
        const parsedFilters = JSON.parse(filterKey);
        const result = await fetchPaymentRequests({
          page,
          limit,
          ...parsedFilters,
          ...(forceRefresh ? { refresh: true } : {}),
        });
        setData(result);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, filterKey],
  );

  const prevTrigger = React.useRef(externalUpdateTrigger);
  const initialMount = React.useRef(true);

  useEffect(() => {
    const isUpdate =
      externalUpdateTrigger && externalUpdateTrigger !== prevTrigger.current;
    prevTrigger.current = externalUpdateTrigger;

    // If it's the initial mount and we already have cached data, do a silent refresh
    const hasCachedData = !!sessionStorage.getItem('applicant_dashboard_data');
    const silent = initialMount.current && hasCachedData;
    initialMount.current = false;

    loadData(!!isUpdate, silent);
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
