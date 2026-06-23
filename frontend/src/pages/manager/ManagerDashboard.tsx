import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import { DatePicker } from '../../components/shared/DatePicker';

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

  const [requests, setRequests] = useState<PaymentRequestWithApplicant[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const fetchRequests = useCallback(async () => {
    setIsListLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (statusFilter !== '') params.statusId = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchQuery) params.applicant = searchQuery;

      const response = await apiClient.get<PaymentRequestWithApplicant[]>('/manager/requests', { params });
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      triggerToast('error', t('dashboard.manager.fetch_error'));
    } finally {
      setIsListLoading(false);
    }
  }, [statusFilter, dateFilter, searchQuery, t]);

  const handleRowClick = (id: number) => {
    navigate(`/manager/requests/${id}`);
  };

  useEffect(() => {
    if (!user) return;

    wsService.connect(user.sub, user.role);

    const handleStatusUpdate = () => {
      fetchRequests();
    };

    wsService.on('statusUpdate', handleStatusUpdate);
    wsService.on('request:status-changed', handleStatusUpdate);

    return () => {
      wsService.off('statusUpdate', handleStatusUpdate);
      wsService.off('request:status-changed', handleStatusUpdate);
      wsService.disconnect();
    };
  }, [user, fetchRequests]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, dateFilter, fetchRequests]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const pendingCount = requests.filter(r => r.statusId === PaymentStatus.SUBMITTED_MANAGER).length;
  const reviewingCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_REVIEWING).length;
  const verifiedCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_VERIFIED).length;
  const rejectedCount = requests.filter(r => r.statusId === PaymentStatus.REJECTED_MANAGER).length;

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

  const isUrgent = (desiredPaymentDate: string | Date) => {
    if (!desiredPaymentDate) return false;
    const diffTime = new Date(desiredPaymentDate).getTime() - new Date().getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse" />
              {t('dashboard.manager.title')}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t('dashboard.manager.welcome_message')}</p>
          </div>
          
          <button
            onClick={() => fetchRequests()}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 active:bg-slate-100 transition shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`h-4 w-4 ${isListLoading ? 'animate-spin' : ''}`} />
            {t('dashboard.manager.refresh')}
          </button>
        </div>

        {/* Metrics Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: t('dashboard.manager.pending_review'),
              count: pendingCount,
              color: 'border-amber-500/20 text-amber-700 bg-amber-500/5',
              glow: 'bg-amber-400',
              status: PaymentStatus.SUBMITTED_MANAGER,
            },
            {
              title: t('dashboard.manager.reviewing'),
              count: reviewingCount,
              color: 'border-indigo-500/20 text-indigo-700 bg-indigo-500/5',
              glow: 'bg-indigo-400',
              status: PaymentStatus.MANAGER_REVIEWING,
            },
            {
              title: t('dashboard.manager.verified'),
              count: verifiedCount,
              color: 'border-emerald-500/20 text-emerald-700 bg-emerald-500/5',
              glow: 'bg-emerald-400',
              status: PaymentStatus.MANAGER_VERIFIED,
            },
            {
              title: t('dashboard.manager.rejected'),
              count: rejectedCount,
              color: 'border-rose-500/20 text-rose-700 bg-rose-500/5',
              glow: 'bg-rose-400',
              status: PaymentStatus.REJECTED_MANAGER,
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setStatusFilter(statusFilter === item.status ? '' : item.status)}
              className={`p-5 rounded-2xl border text-left transition duration-200 transform hover:-translate-y-0.5 hover:shadow-md ${item.color} ${
                statusFilter === item.status ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-85">{item.title}</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.glow}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.glow}`}></span>
                </span>
              </div>
              <div className="text-3xl font-black mt-2 tracking-tight">{item.count}</div>
            </button>
          ))}
        </div>

        {/* Filters and Full-Width Table */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          
          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search by Applicant Name */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.manager.search_placeholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                {t('dashboard.manager.search')}
              </button>
            </div>

            {/* Filter by Status */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center gap-2 px-3 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="flex-1 text-left truncate">
                  {statusFilter === '' ? t('dashboard.manager.all_statuses') : t(`dashboard.manager.${statusFilter === PaymentStatus.SUBMITTED_MANAGER ? 'pending_review' : statusFilter === PaymentStatus.MANAGER_REVIEWING ? 'reviewing' : statusFilter === PaymentStatus.MANAGER_VERIFIED ? 'verified' : 'rejected'}`)}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {isStatusOpen && (
                <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  {[
                    { value: '' as const, label: t('dashboard.manager.all_statuses') },
                    { value: PaymentStatus.SUBMITTED_MANAGER, label: t('dashboard.manager.pending_review') },
                    { value: PaymentStatus.MANAGER_REVIEWING, label: t('dashboard.manager.reviewing') },
                    { value: PaymentStatus.MANAGER_VERIFIED, label: t('dashboard.manager.verified') },
                    { value: PaymentStatus.REJECTED_MANAGER, label: t('dashboard.manager.rejected') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        statusFilter === option.value
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

            {/* Filter by Application Date */}
            <DatePicker value={dateFilter} onChange={setDateFilter} />
          </div>

          {/* Request Queue Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.manager.request_no')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.applicant')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.amount')}</th>
                  <th className="px-4 py-3">{t('dashboard.manager.application_date')}</th>
                  <th className="px-4 py-3 text-center">{t('dashboard.manager.urgent')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.manager.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isListLoading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
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
                  requests.map((req) => {
                    const urgent = isUrgent(req.desiredPaymentDate);

                    return (
                      <tr
                        key={req.paymentRequestId}
                        onClick={() => handleRowClick(req.paymentRequestId)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 active:bg-slate-100/50 ${
                          req.statusId === PaymentStatus.MANAGER_REVIEWING ? 'bg-indigo-50/10' : ''
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
                        <td className="px-4 py-3.5 text-center">
                          {urgent ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse border border-rose-200">
                              {t('dashboard.manager.urgent')}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              STATUS_COLORS[req.statusId as PaymentStatus] || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {STATUS_LABELS_EN[req.statusId as PaymentStatus]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
