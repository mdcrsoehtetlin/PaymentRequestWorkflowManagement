import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CalendarClock, CheckCircle, Clock, RefreshCw } from 'lucide-react';

import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { KpiCard } from '../../components/shared/KpiCard';
import { SearchFilterBar } from '../../components/shared/SearchFilterBar';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import { useAuth } from '../../hooks/useAuth';

import { AccountingQueueTable } from './components/AccountingQueueTable';
import { useAccountingQueue, type KpiFilter } from './hooks/useAccountingQueue';
import { useAccountingWebSockets } from './hooks/useAccountingWebSockets';
import { getSummaryCounts, type SummaryCounts } from './services/accounting.service';

const accountingFilterFields: FilterField[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Request #, applicant name...',
  },
  {
    key: 'branch',
    label: 'Branch',
    type: 'select',
    options: [
      { value: '', label: 'All Branches' },
      { value: 'Yangon', label: 'Yangon' },
      { value: 'Mandalay', label: 'Mandalay' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: '', label: 'All Statuses' },
      { value: '8', label: 'Approved' },
      { value: '10', label: 'Paid' },
    ],
  },
  {
    key: 'desiredDate',
    label: 'Desired Date',
    type: 'date',
  },
];

export function AccountingDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, string | number>>({});

  const {
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
    refreshQueue,
  } = useAccountingQueue(filters);

  useAccountingWebSockets(
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

  const handleKpiClick = (filter: KpiFilter) => {
    setKpiFilter((prev) => (prev === filter ? null : filter));
    setFilters({});
    setPage(1);
  };

  const kpiCards: Array<{
    filter: KpiFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
    activeColor: string;
    inactiveColor: string;
  }> = [
    {
      filter: 'total',
      label: 'Total',
      count: summary?.total ?? 0,
      icon: <CheckCircle />,
      activeColor: 'bg-emerald-200 text-emerald-950 border-2 border-emerald-600 ring-2 ring-emerald-400 shadow-md',
      inactiveColor: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    },
    {
      filter: 'pending',
      label: 'Pending',
      count: summary?.pending ?? 0,
      icon: <Clock />,
      activeColor: 'bg-blue-200 text-blue-950 border-2 border-blue-600 ring-2 ring-blue-400 shadow-md',
      inactiveColor: 'bg-blue-50 text-blue-900 border border-blue-200',
    },
    {
      filter: 'mandalay',
      label: 'Mandalay Alerts',
      count: summary?.mandalayAlerts ?? 0,
      icon: <AlertTriangle />,
      activeColor: 'bg-amber-200 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-400 shadow-md',
      inactiveColor: 'bg-amber-50 text-amber-900 border border-amber-200',
    },
    {
      filter: 'desiredDate',
      label: 'Desired Date Alerts',
      count: summary?.desiredDateAlerts ?? 0,
      icon: <CalendarClock />,
      activeColor: 'bg-rose-200 text-rose-950 border-2 border-rose-600 ring-2 ring-rose-400 shadow-md',
      inactiveColor: 'bg-rose-50 text-rose-900 border border-rose-200',
    },
  ];

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {t('dashboard.accounting.title', 'Accounting Dashboard')}
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.accounting.welcome_message')}</p>
        </h1>
        <div className="flex items-center gap-3">
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
          {kpiCards.map((card) => (
            <KpiCard
              key={card.filter}
              label={card.label}
              count={card.count}
              icon={card.icon}
              colorClasses={kpiFilter === card.filter ? card.activeColor : card.inactiveColor}
              onClick={() => handleKpiClick(card.filter)}
            />
          ))}
        </div>
      )}

      <SearchFilterBar
        fields={accountingFilterFields}
        values={filters}
        onApply={(newFilters) => {
          const formattedFilters = { ...newFilters };
          if (formattedFilters.status) {
            formattedFilters.status = Number(formattedFilters.status);
          }
          Object.keys(formattedFilters).forEach(key => {
            if (formattedFilters[key] === '' || formattedFilters[key] === undefined || formattedFilters[key] === null) {
              delete formattedFilters[key];
            }
          });
          setFilters(formattedFilters);
          setPage(1);
        }}
        onClear={handleClearFilters}
      />

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
