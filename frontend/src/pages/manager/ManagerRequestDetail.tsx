import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiClient from '../../services/api-client';
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
  type UserSummary,
} from '../../types';
import {
  ArrowLeft,
  FileText,
  Clock,
  Eye,
  AlertCircle,
  User,
  Paperclip,
  Check,
  RotateCcw,
  Download,
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

type DetailedPaymentRequest = Omit<PaymentRequestDetailView, 'applicant'> & {
  applicant: UserSummary & { department?: string | null };
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function DetailSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button skeleton */}
        <SkeletonBlock className="h-9 w-32 rounded-lg" />

        {/* Header skeleton */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="space-y-2">
              <SkeletonBlock className="h-7 w-48" />
              <SkeletonBlock className="h-3 w-64" />
            </div>
            <SkeletonBlock className="h-7 w-28 rounded-full" />
          </div>

          {/* Fields skeleton */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-5 w-40" />
              </div>
            ))}
          </div>

          {/* Bank account skeleton */}
          <SkeletonBlock className="h-16 w-full rounded-xl" />

          {/* Purpose skeleton */}
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-20 w-full rounded-xl" />
          </div>

          {/* Breakdown table skeleton */}
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 flex gap-4">
                <SkeletonBlock className="h-3 w-8" />
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-3 flex-1" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-3 py-2 flex gap-4 border-t border-slate-100">
                  <SkeletonBlock className="h-3 w-8" />
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-3 flex-1" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Attachments skeleton */}
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>

          {/* Timeline skeleton */}
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <div className="pl-4 border-l-2 border-slate-100 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1 relative">
                  <div className="absolute -left-[21px] top-1 bg-white border-2 border-slate-200 rounded-full h-3 w-3" />
                  <SkeletonBlock className="h-3 w-48" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Comment & buttons skeleton */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <SkeletonBlock className="h-10 w-full rounded-xl" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function ManagerRequestDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<DetailedPaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get<DetailedPaymentRequest>(`/manager/requests/${id}`);
      setRequest(response.data);
      setComment('');
    } catch (error) {
      console.error('Failed to fetch request details', error);
      const axiosError = error as AxiosErrorResponse;

      if (axiosError.response?.status === 404) {
        setIsNotFound(true);
        triggerToast('error', t('dashboard.manager.request_not_found'));
      } else {
        triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.detail_fetch_error'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRequest();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRequest]);

  const autoReviewTriggered = useRef(false);

  useEffect(() => {
    if (!request || autoReviewTriggered.current) return;
    if (request.statusId !== PaymentStatus.SUBMITTED_MANAGER) return;

    autoReviewTriggered.current = true;

    const triggerStartReview = async () => {
      try {
        const response = await apiClient.patch<DetailedPaymentRequest>(
          `/manager/requests/${request.paymentRequestId}/review`,
          { modifiedDate: request.modifiedDate },
        );
        setRequest(response.data);
      } catch (error) {
        const axiosError = error as AxiosErrorResponse;
        if (axiosError.response?.status === 409) {
          void fetchRequest();
        }
      }
    };

    void triggerStartReview();
  }, [request, fetchRequest]);

  const handleApprove = async () => {
    if (!request) return;
    setIsActionSubmitting(true);
    setValidationError(null);

    if (comment.length > 500) {
      setValidationError(t('dashboard.manager.comment_max_error'));
      setIsActionSubmitting(false);
      return;
    }

    try {
      await apiClient.post(`/manager/requests/${request.paymentRequestId}/approve`, {
        modifiedDate: request.modifiedDate,
        comment: comment || undefined,
      });

      triggerToast('success', t('dashboard.manager.approve_success'));
      navigate('/manager');
    } catch (error) {
      console.error('Verification failed', error);
      const axiosError = error as AxiosErrorResponse;
      if (axiosError.response?.status === 409) {
        triggerToast('warning', t('dashboard.manager.conflict_warning'));
        void fetchRequest();
      } else {
        triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.approve_error'));
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setIsActionSubmitting(true);
    setValidationError(null);

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
      await apiClient.post(`/manager/requests/${request.paymentRequestId}/reject`, {
        modifiedDate: request.modifiedDate,
        comment: trimmedComment,
      });

      triggerToast('success', t('dashboard.manager.reject_success'));
      navigate('/manager');
    } catch (error) {
      console.error('Rejection failed', error);
      const axiosError = error as AxiosErrorResponse;
      if (axiosError.response?.status === 409) {
        triggerToast('warning', t('dashboard.manager.conflict_warning'));
        void fetchRequest();
      } else {
        triggerToast('error', axiosError.response?.data?.message || t('dashboard.manager.reject_error'));
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (requestId: number, receiptId: number, fileName: string) => {
    try {
      const response = await apiClient.get(
        `/manager/requests/${requestId}/receipts/${receiptId}/download`,
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      triggerToast('error', t('dashboard.manager.download_error'));
    }
  };

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

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isNotFound) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="rounded-full bg-rose-50 p-4">
            <AlertCircle className="h-10 w-10 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">{t('dashboard.manager.request_not_found_title')}</h2>
          <p className="text-slate-500 text-sm text-center max-w-md">
            {t('dashboard.manager.request_not_found_detail')}
          </p>
          <button
            onClick={() => navigate('/manager')}
            className="px-5 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm font-semibold transition-colors"
          >
            {t('dashboard.manager.back_to_list')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <FileText className="h-16 w-16 text-slate-300" />
          <p className="text-slate-500 font-medium">{t('dashboard.manager.detail_fetch_error')}</p>
          <button
            onClick={() => navigate('/manager')}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm font-medium"
          >
            {t('dashboard.manager.back_to_list')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/manager')}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('dashboard.manager.back_to_list')}
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Detail Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold font-mono text-indigo-600 tracking-tight">
                {request.requestNumber}
              </h2>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {t('dashboard.manager.last_updated')} {new Date(request.modifiedDate).toLocaleString('ja-JP')}
              </span>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[request.statusId as PaymentStatus]
                }`}
            >
              {STATUS_LABELS_EN[request.statusId as PaymentStatus]}
            </span>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.applicant')}</span>
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {request.applicant?.fullName || t('dashboard.manager.unregistered')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.employee_number')}</span>
                <span className="text-slate-900 font-bold">
                  {request.applicant?.employeeNumber || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.department_branch')}</span>
                <span className="text-slate-950 font-bold">
                  {request.applicant?.branch || t('dashboard.manager.no_branch')}
                  {request.applicant?.department ? ` (${request.applicant.department})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.desired_payment_date')}</span>
                <span className="text-slate-900 font-bold text-rose-600">
                  {formatDate(request.desiredPaymentDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.payment_type')}</span>
                <span className="text-slate-900 font-semibold">
                  {PAYMENT_TYPE_LABELS_EN[request.paymentTypeId as keyof typeof PAYMENT_TYPE_LABELS_EN] || t('dashboard.manager.other')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{t('dashboard.manager.payment_method')}</span>
                <span className="text-slate-900 font-semibold">
                  {PAYMENT_METHOD_LABELS_EN[request.paymentMethodId as keyof typeof PAYMENT_METHOD_LABELS_EN] || t('dashboard.manager.bank_transfer')}
                </span>
              </div>
            </div>

            {/* Bank Account */}
            {request.bankAccountInfo && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                <span className="text-slate-400 block mb-1">{t('dashboard.manager.bank_account_phone')}</span>
                <span className="text-slate-800 font-mono font-semibold">{request.bankAccountInfo}</span>
              </div>
            )}

            {/* Purpose */}
            <div className="text-xs">
              <span className="text-slate-400 block mb-1">{t('dashboard.manager.purpose')}</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                {request.purpose}
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
                  {request.breakdownItems?.map((item) => (
                    <tr key={item.paymentBreakdownItemId}>
                      <td className="px-3 py-2 text-slate-400 text-center">{item.lineNumber}</td>
                      <td className="px-3 py-2 text-slate-500">{formatDate(item.itemDate)}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium">{item.description}</td>
                      <td className="px-3 py-2 text-slate-900 font-semibold text-right">
                        {formatCurrency(item.amount, request.currencyId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/70 border-t border-slate-100 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-slate-600 text-right">{t('dashboard.manager.total_amount')}</td>
                    <td className="px-3 py-2 text-indigo-700 text-right">
                      {formatCurrency(request.totalAmount, request.currencyId)}
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
            {request.receiptFiles?.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-slate-100">
                {t('dashboard.manager.no_receipts')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {request.receiptFiles?.map((file) => (
                  <div key={file.receiptFileId} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-slate-700 font-medium truncate" title={file.originalFileName}>
                        {file.originalFileName}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({file.fileSize ? (parseInt(String(file.fileSize), 10) / 1024).toFixed(1) : '0'} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={file.fileStoragePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('dashboard.manager.preview')}
                      </a>
                      <button
                        onClick={() => handleDownloadReceipt(request.paymentRequestId, file.receiptFileId, file.originalFileName)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('dashboard.manager.download')}
                      </button>
                    </div>
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
              {request.approvalLogs?.map((log) => (
                <div key={log.approvalLogId} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1.5 bg-white border-2 border-indigo-400 rounded-full h-3 w-3"></div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                    <div>
                      <span className="font-semibold text-slate-700">{log.actionTakenByUser?.fullName}</span>
                      {log.actionTakenByUser?.employeeNumber && (
                        <span className="ml-1.5 text-slate-400">({log.actionTakenByUser.employeeNumber})</span>
                      )}
                    </div>
                    <span>{new Date(log.timestamp).toLocaleString('ja-JP')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${ACTION_BADGE_COLORS[log.actionTypeId as keyof typeof ACTION_BADGE_COLORS] || 'bg-slate-100 text-slate-800'
                      }`}>
                      {ACTION_LABELS_EN[log.actionTypeId as keyof typeof ACTION_LABELS_EN]}
                    </span>
                    {log.comment && (
                      <span className="text-slate-500 italic block mt-0.5">
                        &quot;{log.comment}&quot;
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Decision Form Area */}
          {(request.statusId === PaymentStatus.SUBMITTED_MANAGER ||
            request.statusId === PaymentStatus.MANAGER_REVIEWING) && (
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
                  <button
                    onClick={handleReject}
                    disabled={isActionSubmitting}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/30 hover:bg-rose-50 active:bg-rose-100 transition text-xs font-bold disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('dashboard.manager.reject')}
                  </button>

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
      </div>
    </DashboardLayout>
  );
}
