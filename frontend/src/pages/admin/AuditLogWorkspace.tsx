import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Eye, Search, RotateCcw } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { apiClient } from '../../services/api-client';
import { MetadataDetailPanel } from './components/MetadataDetailPanel';
import { formatDateTime } from '../../utils/format';

interface AuditLogRecord {
  approvalLogId: string;
  paymentRequestId: number;
  requestNumber: string;
  actionTakenByUserId: number;
  actorName: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface AuditLogResponse {
  data: AuditLogRecord[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const ACTION_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: 'Created' },
  { value: '2', label: 'Edited' },
  { value: '3', label: 'Submitted' },
  { value: '4', label: 'Manager Review Started' },
  { value: '5', label: 'Manager Verified' },
  { value: '6', label: 'Rejected by Manager' },
  { value: '7', label: 'Approver Review Started' },
  { value: '8', label: 'Approved' },
  { value: '9', label: 'Rejected by Approver' },
  { value: '10', label: 'Payment Completed' },
];

const ACTION_LABELS: Record<number, string> = {
  1: 'Created',
  2: 'Edited',
  3: 'Submitted',
  4: 'Manager Review Started',
  5: 'Manager Verified',
  6: 'Rejected by Manager',
  7: 'Approver Review Started',
  8: 'Approved',
  9: 'Rejected by Approver',
  10: 'Payment Completed',
};

/**
 * @description Audit Log workspace component.
 * Displays global transaction audit logs with search filters and metadata panel.
 */
export function AuditLogWorkspace() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    actionTypeId: '',
    requestId: '',
    actorName: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
  });
  const [dateError, setDateError] = useState('');
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [sorting, setSorting] = useState<{ sortBy: string; sortOrder: 'ASC' | 'DESC' }>({
    sortBy: '',
    sortOrder: 'ASC',
  });

  const handleSortChange = (key: string) => {
    setSorting((prev) => {
      if (prev.sortBy === key) {
        return { ...prev, sortOrder: prev.sortOrder === 'ASC' ? 'DESC' : 'ASC' };
      }
      return { sortBy: key, sortOrder: 'ASC' };
    });
    if (sorting.sortBy !== key) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const doFetchLogs = useCallback(async () => {
    const f = filtersRef.current;
    const p = paginationRef.current;
    setIsLoading(true);
    setDateError('');
    try {
      if (f.startDate && f.endDate && f.startDate > f.endDate) {
        setDateError('Start date cannot be after end date');
        setIsLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (f.startDate) params.set('startDate', f.startDate);
      if (f.endDate) params.set('endDate', f.endDate);
      if (f.actionTypeId) params.set('actionTypeId', f.actionTypeId);
      if (f.requestId) params.set('requestId', f.requestId);
      if (f.actorName) params.set('actorName', f.actorName);
      params.set('page', String(p.page));
      params.set('pageSize', String(p.pageSize));

      const response = await apiClient.get<AuditLogResponse>(
        `/admin/audit-logs?${params.toString()}`,
      );
      setLogs(response.data.data);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.data.meta.totalItems,
        totalPages: response.data.meta.totalPages,
      }));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    doFetchLogs().finally(() => setIsSearching(false));
  }, [doFetchLogs]);

  const handleReset = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      actionTypeId: '',
      requestId: '',
      actorName: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  useEffect(() => {
    doFetchLogs();
  }, []);

  useEffect(() => {
    doFetchLogs();
  }, [pagination.page, pagination.pageSize]);

  const sortedLogs = useMemo(() => {
    if (!sorting.sortBy) return logs;
    return [...logs].sort((a, b) => {
      const aVal = a[sorting.sortBy as keyof AuditLogRecord];
      const bVal = b[sorting.sortBy as keyof AuditLogRecord];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sorting.sortOrder === 'ASC' ? comparison : -comparison;
    });
  }, [logs, sorting]);

  const columns: Column<AuditLogRecord>[] = [
    {
      key: 'paymentRequestId',
      header: 'Request Number',
      sortable: true,
      render: (_val, row) => row.requestNumber,
    },
    {
      key: 'actorName',
      header: 'Actor',
      sortable: true,
    },
    {
      key: 'actionTypeId',
      header: 'Action',
      sortable: true,
      width: '180px',
      render: (_val, row) => ACTION_LABELS[row.actionTypeId] ?? 'Unknown',
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (_val, row) => formatDateTime(row.timestamp),
    },
    {
      key: 'actions',
      header: '',
      render: (_val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          View global transaction history
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-end gap-4">
          <div className="w-40">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Request Number
              </label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <span className="px-2 py-2 text-sm text-slate-500 bg-slate-50 border-r border-slate-300 select-none">PRF-</span>
              <input
                type="text"
                value={filters.requestId}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, requestId: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                onKeyDown={handleKeyDown}
                placeholder="ID"
                className="w-full px-2 py-2 text-sm outline-none border-0"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Actor Name
              </label>
              <input
                type="text"
                value={filters.actorName}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, actorName: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-[216px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Action Type
              </label>
            <select
              value={filters.actionTypeId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, actionTypeId: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
        {dateError && (
          <p className="mt-2 text-sm text-red-600">{dateError}</p>
        )}
      </div>

      <div className="flex gap-6">
        {/* Audit Log Grid */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={sortedLogs}
            isLoading={isLoading}
            emptyMessage="No matching logs found"
            onRowClick={(row) => setSelectedLog(row as unknown as AuditLogRecord)}
            sorting={{
              sortBy: sorting.sortBy,
              sortOrder: sorting.sortOrder,
              onSortChange: handleSortChange,
            }}
            pagination={{
              ...pagination,
              onPageChange: (page) =>
                setPagination((prev) => ({ ...prev, page })),
              onPageSizeChange: (size) =>
                setPagination((prev) => ({ ...prev, pageSize: size, page: 1 })),
            }}
          />
        </div>

        {/* Metadata Detail Panel */}
        {selectedLog && (
          <MetadataDetailPanel
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>
    </div>
  );
}
