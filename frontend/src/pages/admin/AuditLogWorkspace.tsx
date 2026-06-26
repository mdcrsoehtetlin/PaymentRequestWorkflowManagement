import { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, Search } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { apiClient } from '../../services/api-client';
import { MetadataDetailPanel } from './components/MetadataDetailPanel';

interface AuditLogRecord {
  approvalLogId: string;
  paymentRequestId: number;
  requestNumber: string | null;
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

type Filters = Record<string, string>;

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
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    actionTypeId: '',
    requestNumber: '',
    actorName: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
  });
  const [dateError, setDateError] = useState('');
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

  const [draft, setDraft] = useState<Filters>({
    startDate: '',
    endDate: '',
    actionTypeId: '',
    requestNumber: '',
    actorName: '',
  });

  const handleSearch = () => {
    const startDate = draft.startDate;
    const endDate = draft.endDate;
    if (startDate && endDate && startDate > endDate) {
      setDateError('開始日は終了日より後に設定できません');
      return;
    }
    setDateError('');
    let requestNumber = draft.requestNumber;
    if (requestNumber && !requestNumber.startsWith('PRF-')) {
      requestNumber = `PRF-${requestNumber}`;
    }
    setFilters({ ...draft, requestNumber });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClear = () => {
    setDraft({ startDate: '', endDate: '', actionTypeId: '', requestNumber: '', actorName: '' });
    setFilters({ startDate: '', endDate: '', actionTypeId: '', requestNumber: '', actorName: '' });
    setDateError('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const inputClasses = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200';
  const hasActiveFilters = Object.values(draft).some((v) => v !== '');

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (filters.actionTypeId) params.set('actionTypeId', filters.actionTypeId);
        if (filters.requestNumber) params.set('requestNumber', filters.requestNumber);
        if (filters.actorName) params.set('actorName', filters.actorName);
        params.set('page', String(pagination.page));
        params.set('pageSize', String(pagination.pageSize));

        const response = await apiClient.get<AuditLogResponse>(
          `/admin/audit-logs?${params.toString()}`,
          { signal: controller.signal },
        );
        setLogs(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.data.meta.totalItems,
          totalPages: response.data.meta.totalPages,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch audit logs:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [filters, pagination.page, pagination.pageSize]);

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
      key: 'requestNumber',
      header: 'リクエスト番号',
      sortable: true,
      render: (_val, row) => row.requestNumber ?? 'Unknown',
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
      width: '140px',
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Request Number */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">リクエスト番号</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 whitespace-nowrap">
                PRF-
              </span>
              <input
                type="text"
                value={draft.requestNumber}
                onChange={(e) => setDraft((prev) => ({ ...prev, requestNumber: e.target.value }))}
                placeholder="番号を入力"
                className={`${inputClasses} rounded-l-none`}
              />
            </div>
          </div>

          {/* Actor Name */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">実行者名</label>
            <input
              type="text"
              value={draft.actorName}
              onChange={(e) => setDraft((prev) => ({ ...prev, actorName: e.target.value }))}
              placeholder="名前で検索"
              className={inputClasses}
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">アクション種別</label>
            <CustomDropdown
              options={ACTION_OPTIONS}
              value={draft.actionTypeId}
              placeholder="すべて"
              onChange={(val) => setDraft((prev) => ({ ...prev, actionTypeId: String(val ?? '') }))}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">開始日</label>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
              className={inputClasses}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">終了日</label>
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mt-4 pt-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 whitespace-nowrap transition-all duration-200"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                hasActiveFilters
                  ? 'text-slate-700 hover:bg-slate-50 focus:ring-slate-500 cursor-pointer'
                  : 'text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {dateError && (
        <p className="mb-4 text-sm text-red-600">{dateError}</p>
      )}

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
