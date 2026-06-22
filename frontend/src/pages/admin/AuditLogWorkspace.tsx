import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Eye } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { apiClient } from '../../services/api-client';
import { MetadataDetailPanel } from './components/MetadataDetailPanel';

interface AuditLogRecord {
  approvalLogId: string;
  paymentRequestId: number;
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
  { value: '', label: 'すべて' },
  { value: '1', label: '作成' },
  { value: '2', label: '編集' },
  { value: '3', label: '提出' },
  { value: '4', label: 'マネージャー確認開始' },
  { value: '5', label: 'マネージャー確認' },
  { value: '6', label: 'マネージャー差戻し' },
  { value: '7', label: '承認者確認開始' },
  { value: '8', label: '承認' },
  { value: '9', label: '承認者差戻し' },
  { value: '10', label: '支払完了' },
];

const ACTION_LABELS: Record<number, string> = {
  1: '作成',
  2: '編集',
  3: '提出',
  4: 'マネージャー確認開始',
  5: 'マネージャー確認',
  6: 'マネージャー差戻し',
  7: '承認者確認開始',
  8: '承認',
  9: '承認者差戻し',
  10: '支払完了',
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
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
        setDateError('開始日は終了日より後に設定できません');
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

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetchLogs(), 300);
  }, [doFetchLogs]);

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
      header: 'リクエストID',
      sortable: true,
      render: (_val, row) => `PRF-${row.paymentRequestId}`,
    },
    {
      key: 'actorName',
      header: '実行者',
      sortable: true,
    },
    {
      key: 'actionTypeId',
      header: 'アクション',
      sortable: true,
      render: (_val, row) => ACTION_LABELS[row.actionTypeId] ?? '不明',
    },
    {
      key: 'ipAddress',
      header: 'IPアドレス',
      sortable: true,
    },
    {
      key: 'timestamp',
      header: '日時',
      sortable: true,
      render: (_val, row) => new Date(row.timestamp).toLocaleString('ja-JP'),
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
          title="詳細を見る"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">監査ログ</h1>
        <p className="text-sm text-slate-500 mt-1">
          グローバルトランザクション履歴を確認できます
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-end gap-4">
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              リクエストID
            </label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <span className="px-2 py-2 text-sm text-slate-500 bg-slate-50 border-r border-slate-300 select-none">PRF-</span>
              <input
                type="text"
                value={filters.requestId}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, requestId: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  debouncedFetch();
                }}
                placeholder="ID"
                className="w-full px-2 py-2 text-sm outline-none border-0"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              実行者名
            </label>
            <input
              type="text"
              value={filters.actorName}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, actorName: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                debouncedFetch();
              }}
              placeholder="名前で検索"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              アクション種別
            </label>
            <select
              value={filters.actionTypeId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, actionTypeId: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                debouncedFetch();
              }}
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
              開始日
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                debouncedFetch();
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                debouncedFetch();
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
            emptyMessage="該当するログが見つかりません"
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
