import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Clock, FileWarning, RefreshCw, Search } from 'lucide-react';

import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { KpiCard } from '../../components/shared/KpiCard';
import { useAuth } from '../../hooks/useAuth';

import { AccountingQueueTable } from './components/AccountingQueueTable';
import { useAccountingQueue } from './hooks/useAccountingQueue';
import { useAccountingWebSockets } from './hooks/useAccountingWebSockets';
import { getSummaryCounts, type SummaryCounts } from './services/accounting.service';

export function AccountingDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
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
    refreshQueue,
  } = useAccountingQueue();

  const { isConnected } = useAccountingWebSockets(
    user?.sub,
    user?.role,
    refreshQueue,
  );

  const [summary, setSummary] = useState<SummaryCounts | null>(null);

  const fetchSummary = async () => {
    try {
      const counts = await getSummaryCounts();
      setSummary(counts);
    } catch {
      // Summary is non-critical
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchSummary();
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {t('dashboard.accounting.title', 'Accounting Dashboard')}
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.accounting.welcome_message')}</p>
        </h1>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Real-time updates disconnected
            </span>
          )}
          <button
            onClick={() => { refreshQueue(); fetchSummary(); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Approved"
            count={summary.totalApproved}
            icon={<CheckCircle />}
            colorClasses="bg-emerald-50 text-emerald-900 border border-emerald-200"
          />
          <KpiCard
            label="Pending Today"
            count={summary.pendingToday}
            icon={<Clock />}
            colorClasses="bg-blue-50 text-blue-900 border border-blue-200"
          />
          <KpiCard
            label="Mandalay Alerts"
            count={summary.mandalayAlerts}
            icon={<AlertTriangle />}
            colorClasses="bg-amber-50 text-amber-900 border border-amber-200"
          />
          <KpiCard
            label="Missing Receipts"
            count={summary.missingReceipts}
            icon={<FileWarning />}
            colorClasses="bg-red-50 text-red-900 border border-red-200"
          />
        </div>
      )}

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
            <input
              type="text"
              placeholder="Request #, applicant name..."
              className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            />
          </div>
          <div className="min-w-[130px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">Branch</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="Yangon">Yangon</option>
              <option value="Mandalay">Mandalay</option>
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">Date From</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
            />
          </div>
          <div className="min-w-[130px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">Date To</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
            />
          </div>
          <button
            onClick={submitSearch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={clearFilters}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <AccountingQueueTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSelectRequest={(id) => navigate(`/accounting/payment/${id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
