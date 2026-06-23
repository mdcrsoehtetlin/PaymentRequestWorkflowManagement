interface SummarySidebarProps {
  totalQueue: number;
  pendingCount: number;
  reviewingCount: number;
  approvedCount: number;
  rejectedCount: number;
  activeFilter?: number;
  onRefresh: () => void;
  onFilterChange: (statusId?: number) => void;
}

export function SummarySidebar({ totalQueue, pendingCount, reviewingCount, approvedCount, rejectedCount, activeFilter, onRefresh, onFilterChange }: SummarySidebarProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onFilterChange(undefined)}
          className={`text-lg font-semibold hover:text-blue-600 transition-colors ${activeFilter === undefined ? 'text-blue-600' : 'text-slate-900'}`}
        >
          Approval Queue
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => onFilterChange(undefined)}
          className={`rounded-xl p-3 text-left transition-all ${activeFilter === undefined ? 'bg-blue-200 ring-2 ring-blue-400' : 'bg-blue-50 hover:bg-blue-100'}`}
        >
          <p className="text-xs text-blue-600">Total</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{totalQueue}</p>
        </button>
        <button
          type="button"
          onClick={() => onFilterChange(6)}
          className={`rounded-xl p-3 text-left transition-all ${activeFilter === 6 ? 'bg-slate-200 ring-2 ring-slate-400' : 'bg-slate-50 hover:bg-slate-100'}`}
        >
          <p className="text-xs text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{pendingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => onFilterChange(7)}
          className={`rounded-xl p-3 text-left transition-all ${activeFilter === 7 ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-amber-50 hover:bg-amber-100'}`}
        >
          <p className="text-xs text-amber-600">Under Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{reviewingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => onFilterChange(8)}
          className={`rounded-xl p-3 text-left transition-all ${activeFilter === 8 ? 'bg-emerald-200 ring-2 ring-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100'}`}
        >
          <p className="text-xs text-emerald-600">Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{approvedCount}</p>
        </button>
        <button
          type="button"
          onClick={() => onFilterChange(9)}
          className={`rounded-xl p-3 text-left transition-all ${activeFilter === 9 ? 'bg-red-200 ring-2 ring-red-400' : 'bg-red-50 hover:bg-red-100'}`}
        >
          <p className="text-xs text-red-600">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{rejectedCount}</p>
        </button>
      </div>
    </aside>
  );
}
