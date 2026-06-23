import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiClient from '../../services/api-client';
import { wsService } from '../../services/websocket.service';
import { useAuthContext } from '../../hooks/useAuthContext';
import {
  PaymentStatus,
  STATUS_LABELS_EN,
  STATUS_COLORS,
  CURRENCY_CODES,
  PAYMENT_TYPE_LABELS_EN,
  PAYMENT_METHOD_LABELS_EN,
  ACTION_LABELS_EN,
  ACTION_BADGE_COLORS,
  type PaymentRequestDetailView,
  type PaymentRequest,
  type UserSummary,
} from '../../types';
import {
  Search,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Inbox,
  User,
  Paperclip,
  Check,
  RotateCcw,
} from 'lucide-react';

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const triggerToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  window.dispatchEvent(new CustomEvent('globalToast', { detail: { type, message } }));
};

// Define type for list items which include the applicant relation
type PaymentRequestWithApplicant = PaymentRequest & {
  applicant?: UserSummary;
};

// Define detailed type to support applicant's department safely without explicit 'any' type
type DetailedPaymentRequest = Omit<PaymentRequestDetailView, 'applicant'> & {
  applicant: UserSummary & { department?: string | null };
};

export function ManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthContext();

  // State lists
  const [requests, setRequests] = useState<PaymentRequestWithApplicant[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DetailedPaymentRequest | null>(null);
  
  // Loading states
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [comment, setComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch Requests List
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

  // Fetch Request Details
  const fetchRequestDetails = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    setValidationError(null);
    try {
      const response = await apiClient.get<DetailedPaymentRequest>(`/manager/requests/${id}`);
      setSelectedRequest(response.data);
      setComment('');
      
      // If the request was previously SUBMITTED_MANAGER, opening it auto-transitions it to MANAGER_REVIEWING.
      // We reload the list to show the status change immediately.
      const currentRequest = requests.find(r => r.paymentRequestId === id);
      if (currentRequest && currentRequest.statusId === PaymentStatus.SUBMITTED_MANAGER) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to fetch request details', error);
      const axiosError = error as AxiosErrorResponse;
      triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.detail_fetch_error'));
      setSelectedRequest(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [requests, fetchRequests, t]);

  // Handle row click
  const handleRowClick = (id: number) => {
    fetchRequestDetails(id);
  };

  // Handle Approve (Verify) action
  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsActionSubmitting(true);
    setValidationError(null);

    // Comment validation (optional but max 500 chars)
    if (comment.length > 500) {
      setValidationError(t('dashboard.manager.comment_max_error'));
      setIsActionSubmitting(false);
      return;
    }

    try {
      await apiClient.post(`/manager/requests/${selectedRequest.paymentRequestId}/approve`, {
        modifiedDate: selectedRequest.modifiedDate,
        comment: comment || undefined,
      });

      triggerToast('success', t('dashboard.manager.approve_success'));
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Verification failed', error);
      const axiosError = error as AxiosErrorResponse;
      if (axiosError.response?.status === 409) {
        triggerToast('warning', t('dashboard.manager.conflict_warning'));
        fetchRequestDetails(selectedRequest.paymentRequestId);
        fetchRequests();
      } else {
        triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.approve_error'));
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Handle Reject action
  const handleReject = async () => {
    if (!selectedRequest) return;
    setIsActionSubmitting(true);
    setValidationError(null);

    // Rejection validation (mandatory comment: 10 - 500 chars)
    const trimmedComment = comment.trim();
    if (!trimmedComment || trimmedComment.length < 10) {
      setValidationError(t('dashboard.manager.rejection_reason_min_error'));
      setIsActionSubmitting(false);
      return;
    }
    if (trimmedComment.length > 500) {
      setValidationError(t('dashboard.manager.rejection_reason_max_error'));
      setIsActionSubmitting(false);
      return;
    }

    try {
      await apiClient.post(`/manager/requests/${selectedRequest.paymentRequestId}/reject`, {
        modifiedDate: selectedRequest.modifiedDate,
        comment: trimmedComment,
      });

      triggerToast('success', t('dashboard.manager.reject_success'));
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Rejection failed', error);
      const axiosError = error as AxiosErrorResponse;
      if (axiosError.response?.status === 409) {
        triggerToast('warning', t('dashboard.manager.conflict_warning'));
        fetchRequestDetails(selectedRequest.paymentRequestId);
        fetchRequests();
      } else {
        triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.reject_error'));
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // WebSockets Real-Time Sync Setup
  useEffect(() => {
    if (!user) return;
    
    // Connect websocket
    wsService.connect(user.sub, user.role);

    // Listener for status updates and new requests
    const handleStatusUpdate = () => {
      fetchRequests();
      // If the currently open request was updated elsewhere, refresh or close it
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.paymentRequestId);
      }
    };

    wsService.on('statusUpdate', handleStatusUpdate);
    wsService.on('request:status-changed', handleStatusUpdate);

    return () => {
      wsService.off('statusUpdate', handleStatusUpdate);
      wsService.off('request:status-changed', handleStatusUpdate);
      wsService.disconnect();
    };
  }, [user, selectedRequest, fetchRequests, fetchRequestDetails]);

  // Initial load & Debounce search filter input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, dateFilter, searchQuery, fetchRequests]);

  // Compute metrics from the active list
  const pendingCount = requests.filter(r => r.statusId === PaymentStatus.SUBMITTED_MANAGER).length;
  const reviewingCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_REVIEWING).length;
  const verifiedCount = requests.filter(r => r.statusId === PaymentStatus.MANAGER_VERIFIED).length;
  const rejectedCount = requests.filter(r => r.statusId === PaymentStatus.REJECTED_MANAGER).length;

  // Format currency
  const formatCurrency = (amount: string, currencyId: number) => {
    const code = CURRENCY_CODES[currencyId as keyof typeof CURRENCY_CODES] || 'MMK';
    const val = parseFloat(amount) || 0;
    return `${val.toLocaleString()} ${code}`;
  };

  // Format date helper
  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Compute urgent status flag (desired payment date <= 48 hours)
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

        {/* Filters and List View (Split-Pane Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANE: Filters and Table List (60% width) */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search by Applicant Name */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.manager.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Filter by Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                >
                  <option value="">{t('dashboard.manager.all_statuses')}</option>
                  <option value={PaymentStatus.SUBMITTED_MANAGER}>{t('dashboard.manager.pending_review')}</option>
                  <option value={PaymentStatus.MANAGER_REVIEWING}>{t('dashboard.manager.reviewing')}</option>
                  <option value={PaymentStatus.MANAGER_VERIFIED}>{t('dashboard.manager.verified')}</option>
                  <option value={PaymentStatus.REJECTED_MANAGER}>{t('dashboard.manager.rejected')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
              </div>

              {/* Filter by Application Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
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
                      const isSelected = selectedRequest?.paymentRequestId === req.paymentRequestId;
                      const urgent = isUrgent(req.desiredPaymentDate);

                      return (
                        <tr
                          key={req.paymentRequestId}
                          onClick={() => handleRowClick(req.paymentRequestId)}
                          className={`cursor-pointer transition hover:bg-slate-50/80 active:bg-slate-100/50 ${
                            isSelected ? 'bg-indigo-50/50 font-medium' : ''
                          } ${req.statusId === PaymentStatus.MANAGER_REVIEWING ? 'bg-indigo-50/10' : ''}`}
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

          {/* RIGHT PANE: Verification Detail Panel (40% width) */}
          <div className="lg:col-span-5">
            {!selectedRequest ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <FileText className="h-16 w-16 text-slate-300 mb-4 stroke-1" />
                <h3 className="text-base font-bold text-slate-700">{t('dashboard.manager.select_request')}</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[280px]">
                  {t('dashboard.manager.select_request_hint')}
                </p>
              </div>
            ) : isDetailLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                <span className="text-slate-500 font-medium">{t('dashboard.manager.loading_details')}</span>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                
                {/* Detail Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold font-mono text-indigo-600 tracking-tight">
                      {selectedRequest.requestNumber}
                    </h2>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      {t('dashboard.manager.last_updated')} {new Date(selectedRequest.modifiedDate).toLocaleString('en-US')}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      STATUS_COLORS[selectedRequest.statusId as PaymentStatus]
                    }`}
                  >
                    {STATUS_LABELS_EN[selectedRequest.statusId as PaymentStatus]}
                  </span>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  {/* Grid fields */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.applicant')}</span>
                      <span className="text-slate-900 font-bold flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {selectedRequest.applicant?.fullName || t('dashboard.manager.unregistered')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.employee_number')}</span>
                      <span className="text-slate-900 font-bold">
                        {selectedRequest.applicant?.employeeNumber || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.department_branch')}</span>
                      <span className="text-slate-950 font-bold">
                        {selectedRequest.applicant?.branch || t('dashboard.manager.no_branch')} 
                        {selectedRequest.applicant?.department ? ` (${selectedRequest.applicant.department})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.desired_payment_date')}</span>
                      <span className="text-slate-900 font-bold text-rose-600">
                        {formatDate(selectedRequest.desiredPaymentDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.payment_type')}</span>
                      <span className="text-slate-900 font-semibold">
                        {PAYMENT_TYPE_LABELS_EN[selectedRequest.paymentTypeId as keyof typeof PAYMENT_TYPE_LABELS_EN] || t('dashboard.manager.other')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.payment_method')}</span>
                      <span className="text-slate-900 font-semibold">
                        {PAYMENT_METHOD_LABELS_EN[selectedRequest.paymentMethodId as keyof typeof PAYMENT_METHOD_LABELS_EN] || t('dashboard.manager.bank_transfer')}
                      </span>
                    </div>
                  </div>

                  {/* Bank Account */}
                  {selectedRequest.bankAccountInfo && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <span className="text-slate-400 block mb-1">{t('dashboard.manager.bank_account_phone')}</span>
                      <span className="text-slate-800 font-mono font-semibold">{selectedRequest.bankAccountInfo}</span>
                    </div>
                  )}

                  {/* Purpose */}
                  <div className="text-xs">
                    <span className="text-slate-400 block mb-1">{t('dashboard.manager.purpose')}</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {selectedRequest.purpose}
                    </p>
                  </div>
                </div>

                {/* Breakdown items table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    {t('dashboard.manager.payment_breakdown')}
                  </h3>
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 w-12">No</th>
                          <th className="px-3 py-2">{t('dashboard.manager.date')}</th>
                          <th className="px-3 py-2">{t('dashboard.manager.description')}</th>
                          <th className="px-3 py-2 text-right">{t('dashboard.manager.amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedRequest.breakdownItems?.map((item) => (
                          <tr key={item.paymentBreakdownItemId}>
                            <td className="px-3 py-2 text-slate-400 text-center">{item.lineNumber}</td>
                            <td className="px-3 py-2 text-slate-500">{formatDate(item.itemDate)}</td>
                            <td className="px-3 py-2 text-slate-800 font-medium">{item.description}</td>
                            <td className="px-3 py-2 text-slate-900 font-semibold text-right">
                              {formatCurrency(item.amount, selectedRequest.currencyId)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/70 border-t border-slate-100 font-bold">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-slate-600 text-right">{t('dashboard.manager.total_amount')}</td>
                          <td className="px-3 py-2 text-indigo-700 text-right">
                            {formatCurrency(selectedRequest.totalAmount, selectedRequest.currencyId)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    {t('dashboard.manager.receipt_attachments')}
                  </h3>
                  {selectedRequest.receiptFiles?.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-slate-100">
                      {t('dashboard.manager.no_receipts')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedRequest.receiptFiles?.map((file) => (
                        <div key={file.receiptFileId} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="text-slate-700 font-medium truncate" title={file.originalFileName}>
                              {file.originalFileName}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({(parseInt(file.fileSize) / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <a
                            href={file.fileStoragePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t('dashboard.manager.preview')}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timeline / Approval History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {t('dashboard.manager.approval_history')}
                  </h3>
                  <div className="space-y-3 pl-3 border-l-2 border-slate-100 ml-1">
                    {selectedRequest.approvalLogs?.map((log) => (
                      <div key={log.approvalLogId} className="relative text-xs">
                        <div className="absolute -left-[19px] top-1.5 bg-white border-2 border-indigo-400 rounded-full h-3 w-3"></div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-700">{log.actionTakenByUser?.fullName}</span>
                          <span>{new Date(log.timestamp).toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ACTION_BADGE_COLORS[log.actionTypeId as keyof typeof ACTION_BADGE_COLORS] || 'bg-slate-100 text-slate-800'
                          }`}>
                            {ACTION_LABELS_EN[log.actionTypeId as keyof typeof ACTION_LABELS_EN]}
                          </span>
                          {log.comment && (
                            <span className="text-slate-500 italic block mt-0.5">
                              "{log.comment}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Decision Form Area */}
                {(selectedRequest.statusId === PaymentStatus.SUBMITTED_MANAGER ||
                  selectedRequest.statusId === PaymentStatus.MANAGER_REVIEWING) && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="relative">
                      <span className="text-xs font-bold text-slate-600 block mb-1">
                        {t('dashboard.manager.comment_label')}
                      </span>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => {
                          setComment(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder={t('dashboard.manager.comment_placeholder')}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-400">{t('dashboard.manager.max_chars')}</span>
                        <span className={`text-[10px] ${comment.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                          {comment.length} / 500
                        </span>
                      </div>
                    </div>

                    {validationError && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Reject Button */}
                      <button
                        onClick={handleReject}
                        disabled={isActionSubmitting}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/30 hover:bg-rose-50 active:bg-rose-100 transition text-xs font-bold disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t('dashboard.manager.reject')}
                      </button>

                      {/* Approve Button */}
                      <button
                        onClick={handleApprove}
                        disabled={isActionSubmitting}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition text-xs font-bold shadow-md shadow-indigo-600/10 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {t('dashboard.manager.approve')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
