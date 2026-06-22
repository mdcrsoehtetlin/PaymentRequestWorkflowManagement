import { useState, useEffect, useCallback } from 'react';
import { getApprovedRequests, type PaymentRequest } from '../services/accounting.service';

export const useAccountingQueue = () => {
  const [data, setData] = useState<PaymentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedBranch, setAppliedBranch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovedRequests(page, pageSize, appliedSearch, appliedBranch, appliedDateFrom, appliedDateTo);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (err: any) {
      setError(err.message || 'Error fetching queue');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedSearch, appliedBranch, appliedDateFrom, appliedDateTo]);

  // Auto-fetch on any change to page, pageSize, or applied filters
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const submitSearch = useCallback(() => {
    setAppliedSearch(searchInput);
    setAppliedBranch(branchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setPage(1);
  }, [searchInput, branchInput, dateFromInput, dateToInput]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setBranchInput('');
    setDateFromInput('');
    setDateToInput('');
    setAppliedSearch('');
    setAppliedBranch('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setPage(1);
  }, []);

  return {
    data,
    total,
    page,
    pageSize,
    searchInput,
    branchInput,
    dateFromInput,
    dateToInput,
    loading,
    error,
    setPage,
    setPageSize,
    setSearchInput,
    setBranchInput,
    setDateFromInput,
    setDateToInput,
    submitSearch,
    clearFilters,
    refreshQueue: fetchQueue,
  };
};
