import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useManagerDashboardFilters } from '../../hooks/useManagerDashboardFilters';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiClient from '../../services/api-client';
import { wsService } from '../../services/websocket.service';
import { useAuthContext } from '../../hooks/useAuthContext';
import {
  PaymentStatus,
  STATUS_LABELS_EN,
  STATUS_COLORS,
  CURRENCY_CODES,
  type PaymentRequest,
  type UserSummary,
} from '../../types';
import {
  RefreshCw,
} from 'lucide-react';
import { KpiCard, DashboardKpiGrid, SearchFilterBar } from '../../components/shared';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import { LayoutGrid, Clock, Eye, CheckCircle, XCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatDate } from '../../utils/format';

const triggerToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  window.dispatchEvent(new CustomEvent('globalToast', { detail: { type, message } }));
};

type PaymentRequestWithApplicant = PaymentRequest & {
  applicant?: UserSummary;
};

export function ManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [allRequests, setAllRequests] = useState<PaymentRequestWithApplicant[]>([]);
  const [requests, setRequests] = useState<PaymentRequestWithApplicant[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);

  const { filters, setFilters, clearFilters } = useManagerDashboardFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Active query states derived from URL params
  const activeSearch = filters.search;
  const activeStatus = filters.status;
  const activeDate = filters.date;
  const activeBranch = filters.branch;

  // Reset page to 1 during render when filters change
  const [prevFilters, setPrevFilters] = useState({
    search: activeSearch,
    status: activeStatus,
    date: activeDate,
    branch: activeBranch,
  });

  if (
    prevFilters.search !== activeSearch ||
    prevFilters.status !== activeStatus ||
    prevFilters.date !== activeDate ||
    prevFilters.branch !== activeBranch
  ) {
    setPrevFilters({
      search: activeSearch,
      status: activeStatus,
      date: activeDate,
      branch: activeBranch,
    });
    setCurrentPage(1);
  }

  // Sidebar KPI card filter (tracks which card is visually highlighted)
  const sidebarFilter = filters.status !== '' ? filters.status : undefined;

  // Incremented by WebSocket to trigger re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Always fetch the full unfiltered dataset for KPI counters
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      try {
        const response = await apiClient.get<PaymentRequestWithApplicant[]>('/manager/requests');
        if (!cancelled) {
          const sorted = response.data.sort((a, b) => {
            const diff = new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime();
            return diff !== 0 ? diff : b.paymentRequestId - a.paymentRequestId;
          });
          setAllRequests(sorted);
        }
      } catch {
        // KPI counts will show 0 — non-critical
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [refreshKey, location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsListLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (activeStatus !== '') params.statusId = activeStatus;
        if (activeDate) {
          params.dateFrom = activeDate;
          params.dateTo = activeDate;
        }
        if (activeSearch) params.search = activeSearch;
        if (activeBranch) params.branch = activeBranch;

        const response = await apiClient.get<PaymentRequestWithApplicant[]>('/manager/requests', { params });
        if (!cancelled) {
          const sorted = response.data.sort((a, b) => {
            const diff = new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime();
            return diff !== 0 ? diff : b.paymentRequestId - a.paymentRequestId;
          });
          setRequests(sorted);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch requests', error);
          triggerToast('error', t('dashboard.manager.fetch_error'));
        }
      } finally {
        if (!cancelled) setIsListLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activeStatus, activeDate, activeSearch, activeBranch, refreshKey, location.pathname, t]);

  const handleSidebarFilter = (newStatusId?: number) => {
    setFilters({ status: newStatusId ?? '', search: '', date: '', branch: '' });
    setFilterValues({ search: '', branch: '', status: '', date: '' });
  };

  // WebSocket: trigger re-fetch on real-time status updates
  useEffect(() => {
    if (!user) return;

    wsService.connect(user.sub, user.role);

    const handleStatusUpdate = () => {
      setRefreshKey((k) => k + 1);
    };

    wsService.on('statusUpdate', handleStatusUpdate);
    wsService.on('request:status-changed', handleStatusUpdate);

    return () => {
      wsService.off('statusUpdate', handleStatusUpdate);
      wsService.off('request:status-changed', handleStatusUpdate);
      wsService.disconnect();
    };
  }, [user]);

  const totalCount = allRequests.filter(r => r.managerUserId === user?.sub).length;
  const pendingCount = allRequests.filter(r => r.statusId === PaymentStatus.SUBMITTED_MANAGER).length;
  const reviewingCount = allRequests.filter(r => r.statusId === PaymentStatus.MANAGER_REVIEWING).length;
  const verifiedCount = allRequests.filter(r => r.statusId === PaymentStatus.MANAGER_VERIFIED).length;
  const rejectedCount = allRequests.filter(r => r.statusId === PaymentStatus.REJECTED_MANAGER).length;


  const totalResults = requests.length;
  const totalPages = Math.ceil(totalResults / rowsPerPage);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return requests.slice(start, start + rowsPerPage);
  }, [requests, currentPage, rowsPerPage]);

  const formatCurrency = (amount: string, currencyId: number) => {
    const code = CURRENCY_CODES[currencyId as keyof typeof CURRENCY_CODES] || 'MMK';
    const val = parseFloat(amount) || 0;
    return `${val.toLocaleString()} ${code}`;
  };

  const handleProcess = useCallback((paymentRequestId: number | undefined) => {
    if (paymentRequestId == null) return;
    navigate(`/manager/requests/${paymentRequestId}`, {
      state: { returnFilters: location.search },
    });
  }, [navigate, location.search]);

  const columns: Column<PaymentRequestWithApplicant>[] = useMemo(() => [
    {
      key: 'requestNumber',
      header: t('dashboard.manager.request_no'),
      render: (_, row) => (
        <span className="text-indigo-600 font-mono tracking-tight">
          {row.requestNumber}
        </span>
      ),
      width: '13%',
    },
    {
      key: 'applicant',
      header: t('dashboard.manager.applicant'),
      render: (_, row) => (
        <span className="text-slate-900 font-medium">
          {row.applicant?.fullName || t('dashboard.manager.unregistered')}
        </span>
      ),
      width: '16%',
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (_, row) => (
        <span className="text-slate-600">{row.applicant?.branch || '-'}</span>
      ),
      width: '10%',
    },
    {
      key: 'totalAmount',
      header: t('dashboard.manager.amount'),
      render: (_, row) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.totalAmount, row.currencyId)}
        </span>
      ),
      width: '14%',
    },
    {
      key: 'applicationDate',
      header: t('dashboard.manager.application_date'),
      render: (_, row) => (
        <span className="text-slate-500">{formatDate(row.applicationDate)}</span>
      ),
      width: '13%',
    },
    {
      key: 'desiredPaymentDate',
      header: 'Desired Date',
      render: (_, row) => (
        <span className="text-slate-500">{formatDate(row.desiredPaymentDate)}</span>
      ),
      width: '12%',
    },
    {
      key: 'statusId',
      header: t('dashboard.manager.status'),
      render: (_, row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[row.statusId as PaymentStatus] || 'bg-slate-100 text-slate-800'
            }`}
        >
          {STATUS_LABELS_EN[row.statusId as PaymentStatus]}
        </span>
      ),
      width: '12%',
    },
    {
      key: 'action',
      header: 'ACTION',
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleProcess(row.paymentRequestId); }}
          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
      width: '10%',
    },
  ], [t, handleProcess]);



  const managerFilterFields: FilterField[] = [
    {
      key: 'search',
      label: t('dashboard.manager.search'),
      type: 'text',
      placeholder: t('dashboard.manager.search_placeholder'),
    },
    {
      key: 'branch',
      label: t('dashboard.manager.branch'),
      type: 'select',
      placeholder: t('dashboard.manager.all_branches'),
      options: [
        { value: '', label: t('dashboard.manager.all_branches') },
        { value: 'Yangon', label: t('common.branch.yangon') },
        { value: 'Mandalay', label: t('common.branch.mandalay') },
        { value: 'Naypyitaw', label: t('common.branch.naypyidaw') },
      ],
    },
    {
      key: 'status',
      label: t('dashboard.manager.status'),
      type: 'select',
      placeholder: t('dashboard.manager.all_statuses'),
      options: [
        { value: '', label: t('dashboard.manager.all_statuses') },
        { value: PaymentStatus.SUBMITTED_MANAGER, label: t('dashboard.manager.pending_review') },
        { value: PaymentStatus.MANAGER_REVIEWING, label: t('dashboard.manager.reviewing') },
        { value: PaymentStatus.MANAGER_VERIFIED, label: t('dashboard.manager.verified') },
        { value: PaymentStatus.REJECTED_MANAGER, label: t('dashboard.manager.rejected') },
        { value: PaymentStatus.SUBMITTED_APPROVER, label: t('dashboard.manager.status_submitted_approver') },
        { value: PaymentStatus.APPROVER_REVIEWING, label: t('dashboard.manager.status_approver_reviewing') },
        { value: PaymentStatus.APPROVED, label: t('dashboard.manager.status_approved') },
        { value: PaymentStatus.REJECTED_APPROVER, label: t('dashboard.manager.status_rejected_approver') },
        { value: PaymentStatus.PAID, label: t('dashboard.manager.status_paid') },
      ],
    },
    {
      key: 'date',
      label: t('dashboard.manager.date'),
      type: 'date',
    },
  ];

  const [filterValues, setFilterValues] = useState<Record<string, string | number>>({
    search: filters.search,
    branch: filters.branch,
    status: filters.status,
    date: filters.date,
  });

  const handleSearchApply = (values: Record<string, string | number>) => {
    setFilterValues(values);
    setFilters({
      search: typeof values.search === 'string' ? values.search : '',
      status: typeof values.status === 'number' ? values.status : (values.status === '' ? '' : Number(values.status)),
      date: typeof values.date === 'string' ? values.date : '',
      branch: typeof values.branch === 'string' ? values.branch : '',
    });
  };

  const handleClearFilters = () => {
    setFilterValues({});
    clearFilters();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('dashboard.manager.title')}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t('dashboard.manager.welcome_message')}</p>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isListLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className={`h-4 w-4 ${isListLoading ? 'animate-spin' : ''}`} />
            {t('dashboard.manager.refresh')}
          </button>
        </div>

        {/* Metrics Summary Row */}
        <DashboardKpiGrid>
          <div className={sidebarFilter === undefined ? 'ring-2 ring-blue-400 rounded-xl' : ''}>
            <KpiCard
              label={t('dashboard.manager.total_assigned')}
              count={totalCount}
              icon={<LayoutGrid />}
              colorClasses="bg-blue-50 text-blue-900 border border-blue-200"
              onClick={() => handleSidebarFilter(undefined)}
            />
          </div>
          <div className={sidebarFilter === PaymentStatus.SUBMITTED_MANAGER ? 'ring-2 ring-amber-400 rounded-xl' : ''}>
            <KpiCard
              label={t('dashboard.manager.pending_review')}
              count={pendingCount}
              icon={<Clock />}
              colorClasses="bg-amber-50 text-amber-900 border border-amber-200"
              onClick={() => handleSidebarFilter(PaymentStatus.SUBMITTED_MANAGER)}
            />
          </div>
          <div className={sidebarFilter === PaymentStatus.MANAGER_REVIEWING ? 'ring-2 ring-indigo-400 rounded-xl' : ''}>
            <KpiCard
              label={t('dashboard.manager.reviewing')}
              count={reviewingCount}
              icon={<Eye />}
              colorClasses="bg-indigo-50 text-indigo-900 border border-indigo-200"
              onClick={() => handleSidebarFilter(PaymentStatus.MANAGER_REVIEWING)}
            />
          </div>
          <div className={sidebarFilter === PaymentStatus.MANAGER_VERIFIED ? 'ring-2 ring-emerald-400 rounded-xl' : ''}>
            <KpiCard
              label={t('dashboard.manager.verified')}
              count={verifiedCount}
              icon={<CheckCircle />}
              colorClasses="bg-emerald-50 text-emerald-900 border border-emerald-200"
              onClick={() => handleSidebarFilter(PaymentStatus.MANAGER_VERIFIED)}
            />
          </div>
          <div className={sidebarFilter === PaymentStatus.REJECTED_MANAGER ? 'ring-2 ring-rose-400 rounded-xl' : ''}>
            <KpiCard
              label={t('dashboard.manager.rejected')}
              count={rejectedCount}
              icon={<XCircle />}
              colorClasses="bg-rose-50 text-rose-900 border border-rose-200"
              onClick={() => handleSidebarFilter(PaymentStatus.REJECTED_MANAGER)}
            />
          </div>
        </DashboardKpiGrid>

        {/* Filter Block */}
        <div className="[&_button>span:first-child]:whitespace-nowrap">
          <SearchFilterBar
            fields={managerFilterFields}
            values={filterValues}
            onApply={handleSearchApply}
            onClear={handleClearFilters}
          />
        </div>

        {/* Request Queue Table */}
        <DataTable
          columns={columns}
          data={paginatedRequests}
          isLoading={isListLoading}
          onRowClick={(row) => handleProcess(row.paymentRequestId)}
          pagination={{
            page: currentPage,
            pageSize: rowsPerPage,
            totalItems: totalResults,
            totalPages: totalPages,
            onPageChange: setCurrentPage,
            onPageSizeChange: (size) => { setRowsPerPage(size); setCurrentPage(1); },
          }}
          emptyMessage={t('dashboard.manager.no_requests')}
        />
      </div>
    </DashboardLayout>
  );
}
