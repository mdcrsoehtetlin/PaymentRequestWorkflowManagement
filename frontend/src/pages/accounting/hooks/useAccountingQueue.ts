import { useState, useEffect, useCallback } from 'react';
import {
  getApprovedRequests,
  type PaymentRequest,
} from '../services/accounting.service';

export type KpiFilter = 'total' | 'pending' | 'mandalay' | 'desiredDate';

const STORAGE_KEY = 'accounting_kpi_filter';

const readStoredFilter = (): KpiFilter | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (
      stored === 'total' ||
      stored === 'pending' ||
      stored === 'mandalay' ||
      stored === 'desiredDate'
    ) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'pending';
};

export const useAccountingQueue = (
  filters: Record<string, string | number>,
) => {
  const [data, setData] = useState<PaymentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [kpiFilter, setKpiFilter] = useState<KpiFilter | null>(
    readStoredFilter,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist kpiFilter to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (kpiFilter) {
        sessionStorage.setItem(STORAGE_KEY, kpiFilter);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [kpiFilter]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovedRequests(
        page,
        pageSize,
        String(filters.search ?? ''),
        String(filters.branch ?? ''),
        String(filters.desiredDate ?? ''),
        kpiFilter ?? undefined,
        filters.status ? Number(filters.status) : undefined,
      );
      setData(response.data);
      setTotal(response.meta.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching queue');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, kpiFilter]);

  // Auto-fetch on any change to page, pageSize, or filters
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getApprovedRequests(
          page,
          pageSize,
          String(filters.search ?? ''),
          String(filters.branch ?? ''),
          String(filters.desiredDate ?? ''),
          kpiFilter ?? undefined,
          filters.status ? Number(filters.status) : undefined,
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
  }, [page, pageSize, filters, kpiFilter]);

  return {
    data,
    total,
    page,
    pageSize,
    kpiFilter,
    loading,
    error,
    setPage,
    setPageSize,
    setKpiFilter,
    refreshQueue: fetchQueue,
  };
};
