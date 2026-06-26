import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Search,
  RefreshCw,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import { KpiCard, DashboardKpiGrid } from '../../components/shared';
import { LayoutGrid, Clock, Eye, CheckCircle, XCircle } from 'lucide-react';

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

  const [requests, setRequests] = useState<PaymentRequestWithApplicant[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local staging states (bound to UI inputs, no fetch on change)
  const [localSearchText, setLocalSearchText] = useState('');
  const [localStatus, setLocalStatus] = useState<number | ''>('');
  const [localDate, setLocalDate] = useState('');

  // Active query states (used by fetch effect)
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<number | ''>('');
  const [activeDate, setActiveDate] = useState('');

  // Incremented by WebSocket to trigger re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Sidebar KPI card filter (tracks which card is visually highlighted)
  const [sidebarFilter, setSidebarFilter] = useState<number | undefined>(undefined);

  // Fetch on mount and whenever active filters change
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
        if (activeSearch) params.applicant = activeSearch;

        const response = await apiClient.get<PaymentRequestWithApplicant[]>('/manager/requests', { params });
        if (!cancelled) setRequests(response.data);
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
  }, [activeStatus, activeDate, activeSearch, refreshKey, location.pathname, t]);

  const handleSearch = () => {
    setActiveSearch(localSearchText);
    setActiveStatus(localStatus);
    setActiveDate(localDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setLocalSearchText('');
    setLocalStatus('');
    setLocalDate('');
    setActiveSearch('');
    setActiveStatus('');
    setActiveDate('');
    setSidebarFilter(undefined);
    setPage(1);
  };

  const handleSidebarFilter = (newStatusId?: number) => {
    setSidebarFilter(newStatusId);
    setLocalSearchText('');
    setLocalStatus('');
    setLocalDate('');
    setActiveSearch('');
    setActiveStatus(newStatusId ?? '');
    setActiveDate('');
    setPage(1);
  };

  const handleProcess = (paymentRequestId: number | undefined) => {
    if (paymentRequestId == null) return;
    navigate(`/manager/requests/${paymentRequestId}`);
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



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCount = requests.filter(r => r.managerUserId === user?.sub).length;
  const pendingCount = requests.filter(r => r.statusId === PaymentStatus.SUBMITTED_MANAGER).length;
  const reviewingCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_REVIEWING).length;
  const verifiedCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_VERIFIED).length;
  const rejectedCount = requests.filter(r => r.statusId === PaymentStatus.REJECTED_MANAGER).length;


  const totalResults = requests.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const paginatedRequests = requests.slice((page - 1) * pageSize, page * pageSize);
  const showStart = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const showEnd = Math.min(page * pageSize, totalResults);

  const formatCurrency = (amount: string, currencyId: number) => {
    const code = CURRENCY_CODES[currencyId as keyof typeof CURRENCY_CODES] || 'MMK';
    const val = parseFloat(amount) || 0;
    return `${val.toLocaleString()} ${code}`;
  };

  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };



  const statusLabel = (val: number | '') => {
    if (val === '') return t('dashboard.manager.all_statuses');
    if (val === PaymentStatus.SUBMITTED_MANAGER) return t('dashboard.manager.pending_review');
    if (val === PaymentStatus.MANAGER_REVIEWING) return t('dashboard.manager.reviewing');
    if (val === PaymentStatus.MANAGER_VERIFIED) return t('dashboard.manager.verified');
    if (val === PaymentStatus.REJECTED_MANAGER) return t('dashboard.manager.rejected');
    if (val === PaymentStatus.SUBMITTED_APPROVER) return t('dashboard.manager.status_submitted_approver');
    if (val === PaymentStatus.APPROVER_REVIEWING) return t('dashboard.manager.status_approver_reviewing');
    if (val === PaymentStatus.APPROVED) return t('dashboard.manager.status_approved');
    if (val === PaymentStatus.REJECTED_APPROVER) return t('dashboard.manager.status_rejected_approver');
    if (val === PaymentStatus.PAID) return t('dashboard.manager.status_paid');
    return t('dashboard.manager.all_statuses');
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">{t('dashboard.manager.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.manager.search_placeholder')}
                  value={localSearchText}
                  onChange={(e) => setLocalSearchText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-full rounded-md border border-slate-300 p-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="min-w-[130px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="flex items-center gap-2 px-3 py-2 w-full border border-slate-300 rounded-md bg-white text-sm text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="flex-1 text-left truncate">{statusLabel(localStatus)}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {isStatusOpen && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                    {[
                      { value: '' as const, label: t('dashboard.manager.all_statuses') },
                      { value: PaymentStatus.SUBMITTED_MANAGER, label: t('dashboard.manager.pending_review') },
                      { value: PaymentStatus.MANAGER_REVIEWING, label: t('dashboard.manager.reviewing') },
                      { value: PaymentStatus.MANAGER_VERIFIED, label: t('dashboard.manager.verified') },
                      { value: PaymentStatus.REJECTED_MANAGER, label: t('dashboard.manager.rejected') },
                      { value: PaymentStatus.SUBMITTED_APPROVER, label: t('dashboard.manager.status_submitted_approver') },
                      { value: PaymentStatus.APPROVER_REVIEWING, label: t('dashboard.manager.status_approver_reviewing') },
                      { value: PaymentStatus.APPROVED, label: t('dashboard.manager.status_approved') },
                      { value: PaymentStatus.REJECTED_APPROVER, label: t('dashboard.manager.status_rejected_approver') },
                      { value: PaymentStatus.PAID, label: t('dashboard.manager.status_paid') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setLocalStatus(option.value);
                          setIsStatusOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${localStatus === option.value
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
              <input
                type="date"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isListLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Search className="h-4 w-4" />
              {t('dashboard.manager.search')}
            </button>

            <button
              onClick={handleClearFilters}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Request Queue Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.manager.request_no')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.applicant')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.amount')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.application_date')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.status')}</th>
                  <th className="px-4 py-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isListLoading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                        <span className="text-slate-400">{t('dashboard.manager.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <Inbox className="h-10 w-10 opacity-60" />
                        <span>{t('dashboard.manager.no_requests')}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => {
                    return (
                      <tr
                        key={req.paymentRequestId}
                        className={`transition ${req.statusId === PaymentStatus.MANAGER_REVIEWING ? 'bg-indigo-50/10' : ''
                          }`}
                      >
                        <td className="px-4 py-3.5 text-indigo-600 font-mono tracking-tight">
                          {req.requestNumber}
                        </td>
                        <td className="px-4 py-3.5 text-slate-900 font-medium">
                          {req.applicant?.fullName || t('dashboard.manager.unregistered')}
                        </td>
                        <td className="px-4 py-3.5 text-slate-900 font-semibold">
                          {formatCurrency(req.totalAmount, req.currencyId)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {formatDate(req.applicationDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.statusId as PaymentStatus] || 'bg-slate-100 text-slate-800'
                              }`}
                          >
                            {STATUS_LABELS_EN[req.statusId as PaymentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleProcess(req.paymentRequestId)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalResults > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center text-sm text-slate-500">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="mr-2 rounded border-slate-300 bg-white text-sm text-slate-900"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} rows
                    </option>
                  ))}
                </select>
                Showing
                <span className="mx-2 font-medium text-slate-900">{showStart}</span>
                -
                <span className="mx-2 font-medium text-slate-900">{showEnd}</span>
                of <span className="mx-1 font-medium text-slate-900">{totalResults}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 text-sm text-slate-600">
                  {page} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
