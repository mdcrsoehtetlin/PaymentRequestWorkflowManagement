import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export function usePagination(defaultPageSize = 10): UsePaginationReturn {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const setPage = useCallback((p: number) => setPageState(p), []);
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1); // Reset to first page
  }, []);
  const reset = useCallback(() => { setPageState(1); }, []);

  return { page, pageSize, setPage, setPageSize, reset };
}
