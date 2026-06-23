import { useCallback, useState } from 'react';
import { approverService } from '../services/approver.service';
import type { PaginationMeta } from '../../../types';
import type { ApproverRequestListItem, ApproverRequestQuery } from '../types';
import { DEFAULT_PAGE_SIZE } from '../../../utils/constants';

export function useApproverRequests() {
  const [query, setQuery] = useState<ApproverRequestQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: 'managerVerificationDate',
    sortOrder: 'DESC',
    showAll: false,
  });
  const [requests, setRequests] = useState<ApproverRequestListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = useCallback(
    async (nextQuery?: ApproverRequestQuery) => {
      const effectiveQuery = nextQuery ?? query;
      setIsLoading(true);
      try {
        const result = await approverService.fetchRequests(effectiveQuery);
        setRequests(result.data);
        setMeta(result.meta);
        setQuery(effectiveQuery);
      } finally {
        setIsLoading(false);
      }
    },
    [query],
  );

  const setPage = useCallback(
    (page: number) => loadRequests({ ...query, page }),
    [loadRequests, query],
  );

  const setPageSize = useCallback(
    (pageSize: number) => loadRequests({ ...query, pageSize, page: 1 }),
    [loadRequests, query],
  );

  const setSort = useCallback(
    (sortBy: string) => {
      const sortOrder = query.sortBy === sortBy && query.sortOrder === 'DESC' ? 'ASC' : 'DESC';
      return loadRequests({ ...query, sortBy, sortOrder, page: 1 });
    },
    [loadRequests, query],
  );

  const applyFilters = useCallback(
    (filters: Partial<ApproverRequestQuery>) =>
      loadRequests({ ...query, ...filters, page: 1 }),
    [loadRequests, query],
  );

  return {
    query,
    requests,
    meta,
    isLoading,
    loadRequests,
    setPage,
    setPageSize,
    setSort,
    applyFilters,
  };
}
