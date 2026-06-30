import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSortChange: (key: string) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  pagination,
  sorting,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  if (isLoading && data.length === 0) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-md"></div>
        ))}
      </div>
    );
  }

  if (!isLoading && data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="flex flex-col w-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                    col.sortable && sorting ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && sorting && sorting.onSortChange(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sorting && sorting.sortBy === col.key && (
                      sorting.sortOrder === 'ASC' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick && onRowClick(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors duration-150' : 'transition-colors duration-150'}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-slate-900">
                    {col.render ? col.render((row as Record<string, unknown>)[col.key], row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center text-sm text-slate-500">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="mr-2 border-slate-300 rounded text-sm bg-white"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} {t('common.rows')}
                </option>
              ))}
            </select>
            {t('common.showing')}
            <span className="mx-2 font-medium text-slate-900">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalItems)}
            </span>
            -
            <span className="mx-2 font-medium text-slate-900">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
            </span>
            {t('common.of')} <span className="mx-1 font-medium text-slate-900">{pagination.totalItems}</span> {t('common.results')}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t('common.previous')}
            </button>
            <span className="text-sm text-slate-600 px-2">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
