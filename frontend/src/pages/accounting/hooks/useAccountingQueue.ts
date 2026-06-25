import { useState, useEffect, useCallback } from 'react';
import {
  getApprovedRequests,
  type PaymentRequest,
} from '../services/accounting.service';

export type KpiFilter = 'total' | 'pending' | 'mandalay' | 'desiredDate';

export const useAccountingQueue = () => {
  const [data, setData] = useState<PaymentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [desiredDateInput, setDesiredDateInput] = useState('');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedBranch, setAppliedBranch] = useState('');
  const [appliedDesiredDate, setAppliedDesiredDate] = useState('');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter | null>('pending');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovedRequests(
        page,
        pageSize,
        appliedSearch,
        appliedBranch,
        appliedDesiredDate,
        kpiFilter ?? undefined,
      );
      setData(response.data);
      setTotal(response.meta.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching queue');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    appliedSearch,
    appliedBranch,
    appliedDesiredDate,
    kpiFilter,
  ]);

  // Auto-fetch on any change to page, pageSize, or applied filters
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getApprovedRequests(
          page,
          pageSize,
          appliedSearch,
          appliedBranch,
          appliedDesiredDate,
          kpiFilter ?? undefined,
        );
        setData(response.data);
        setTotal(response.meta.total);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching queue');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [
    page,
    pageSize,
    appliedSearch,
    appliedBranch,
    appliedDesiredDate,
    kpiFilter,
  ]);

  const submitSearch = useCallback(() => {
    setAppliedSearch(searchInput);
    setAppliedBranch(branchInput);
    setAppliedDesiredDate(desiredDateInput);
    setPage(1);
  }, [searchInput, branchInput, desiredDateInput]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setBranchInput('');
    setDesiredDateInput('');
    setAppliedSearch('');
    setAppliedBranch('');
    setAppliedDesiredDate('');
    setPage(1);
  }, []);

  return {
    data,
    total,
    page,
    pageSize,
    searchInput,
    branchInput,
    desiredDateInput,
    kpiFilter,
    loading,
    error,
    setPage,
    setPageSize,
    setSearchInput,
    setBranchInput,
    setDesiredDateInput,
    setKpiFilter,
    submitSearch,
    clearFilters,
    refreshQueue: fetchQueue,
  };
};
