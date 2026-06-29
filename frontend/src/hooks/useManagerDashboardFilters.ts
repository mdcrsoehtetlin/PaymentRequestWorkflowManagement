import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface ManagerDashboardFilters {
  search: string;
  status: number | '';
  date: string;
}

const STORAGE_KEY_PAGE = 'manager_dashboard_page';

function readPage(): number {
  const stored = sessionStorage.getItem(STORAGE_KEY_PAGE);
  return stored ? Number(stored) : 1;
}

export function useManagerDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status');
  const status: number | '' = statusParam ? Number(statusParam) : '';
  const date = searchParams.get('date') ?? '';

  const filters = useMemo<ManagerDashboardFilters>(
    () => ({ search, status, date }),
    [search, status, date],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const page = useMemo(() => readPage(), [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<ManagerDashboardFilters>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (updates.search !== undefined) {
          if (updates.search) next.set('search', updates.search);
          else next.delete('search');
        }
        if (updates.status !== undefined) {
          if (updates.status !== '') next.set('status', String(updates.status));
          else next.delete('status');
        }
        if (updates.date !== undefined) {
          if (updates.date) next.set('date', updates.date);
          else next.delete('date');
        }

        return next;
      });
      sessionStorage.removeItem(STORAGE_KEY_PAGE);
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (newPage: number) => {
      sessionStorage.setItem(STORAGE_KEY_PAGE, String(newPage));
      setSearchParams((prev) => new URLSearchParams(prev));
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
    sessionStorage.removeItem(STORAGE_KEY_PAGE);
  }, [setSearchParams]);

  return { filters, page, setFilters, setPage, clearFilters };
}
