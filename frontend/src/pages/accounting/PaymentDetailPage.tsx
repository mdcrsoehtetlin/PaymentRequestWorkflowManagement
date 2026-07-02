import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BranchAlertBanner } from './components/BranchAlertBanner';
import { PaymentCompletionDialog } from './components/PaymentCompletionDialog';
import { ReadOnlyBreakdownGrid } from './components/ReadOnlyBreakdownGrid';
import { ApprovalTimeline } from '../../components/shared/ApprovalTimeline';
import {
  completePayment,
  getPaymentRequestDetails,
  type AccountingPaymentDetail,
} from './services/accounting.service';
import type { ApprovalLogWithUser } from '../../types';

const formatDate = (value: string): string => new Date(value).toLocaleDateString();

const formatFileSize = (value: string): string => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const requestId = Number(id);

  const [details, setDetails] = useState<AccountingPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getPaymentRequestDetails(requestId);
        if (isMounted) setDetails(data);
      } catch {
        if (isMounted) setToast({ message: t('accounting.errors.load_details'), type: 'error' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [requestId, t]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const gridSum = useMemo(
    () => details?.breakdownItems.reduce((t, item) => t + Number(item.amount), 0) ?? 0,
    [details],
  );

  const totalAmount = Number(details?.paymentDetails.totalAmount ?? 0);
  const isMismatched = details !== null && Math.abs(gridSum - totalAmount) > 0.01;
  const isMissingReceipts = details !== null && details.hasReceipt && details.receiptFiles.length === 0;
  const isPaid = details?.statusId === 10;

  /** Map accounting timeline items to the ApprovalLogWithUser shape expected by ApprovalTimeline. */
  const approvalLogs = useMemo<ApprovalLogWithUser[]>(
    () =>
      (details?.approvalTimeline ?? []).map((item) => ({
        approvalLogId: item.id,
        paymentRequestId: 0,
        actionTakenByUserId: item.user.userId,
        actionTypeId: item.actionTypeId,
        previousStatusId: item.previousStatusId,
        newStatusId: item.newStatusId,
        comment: item.comment,
        ipAddress: '',
        userAgent: '',
        timestamp: item.timestamp,
        actionTakenByUser: {
          userId: item.user.userId,
          fullName: item.user.fullName,
          employeeNumber: item.user.employeeNumber,
          branch: '',
          roleId: item.user.roleId ?? null,
        },
      })),
    [details],
  );

  const handleConfirmComplete = async () => {
    try {
      setSubmitting(true);
      await completePayment(requestId, comment.trim() || undefined);
      setShowConfirmDialog(false);
      setToast({ message: t('accounting.success.paid'), type: 'success' });
      window.setTimeout(() => navigate('/accounting'), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('accounting.errors.complete_payment');
      setShowConfirmDialog(false);
      setToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">{t('accounting.detail.loading')}</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-slate-600">{t('accounting.detail.not_found')}</p>
          <button onClick={() => navigate('/accounting')} className="mt-4 text-blue-700 hover:underline">
            {t('accounting.detail.back_to_dashboard')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/accounting')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('accounting.detail.back_to_dashboard')}
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{details.requestNumber}</h1>
          {isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {t('accounting.detail.paid_badge')}
            </span>
          )}
        </div>
      </div>

      <BranchAlertBanner branch={details.applicant.branch} />

      {isMismatched && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('accounting.detail.alerts.total_mismatch')}</p>
            <p className="mt-1 text-sm">
              {t('accounting.detail.alerts.total_mismatch_detail', { headerTotal: totalAmount.toLocaleString(), breakdownSum: gridSum.toLocaleString() })} {details.paymentDetails.currencyCode}.
            </p>
          </div>
        </div>
      )}

      {isMissingReceipts && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('accounting.detail.alerts.missing_receipts')}</p>
            <p className="mt-1 text-sm">{t('accounting.detail.alerts.missing_receipts_detail')}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">{t('accounting.detail.sections.applicant')}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">{t('accounting.detail.fields.name')}</dt>
                <dd className="font-medium text-slate-900">{details.applicant.fullName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">{t('accounting.detail.fields.employee')}</dt>
                <dd className="text-slate-900">{details.applicant.employeeNumber}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">{t('accounting.detail.fields.branch')}</dt>
                <dd className="text-slate-900">{t(`common.branch.${details.applicant.branch.toLowerCase()}`, details.applicant.branch)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">{t('accounting.detail.fields.department')}</dt>
                <dd className="text-slate-900">{details.applicant.department ?? '-'}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">{t('accounting.detail.fields.email')}</dt>
                <dd className="break-all text-slate-900">{details.applicant.email}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">{t('accounting.detail.sections.payment')}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.total')}</dt>
                <dd className="font-bold text-slate-900">{totalAmount.toLocaleString()} {details.paymentDetails.currencyCode}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.method')}</dt>
                <dd className="text-slate-900">{details.paymentDetails.paymentMethodName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.type')}</dt>
                <dd className="text-slate-900">{details.paymentDetails.paymentTypeName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.application')}</dt>
                <dd className="text-slate-900">{formatDate(details.paymentDetails.applicationDate)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.desired_date')}</dt>
                <dd className="text-slate-900">{formatDate(details.paymentDetails.desiredPaymentDate)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">{t('accounting.detail.fields.bank_info')}</dt>
                <dd className="text-slate-900">{details.paymentDetails.bankAccountInfo ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">{t('accounting.detail.sections.request_context')}</h3>
          <div className="space-y-3 text-sm text-slate-800">
            <div>
              <p className="font-medium text-slate-600">{t('accounting.detail.fields.purpose')}</p>
              <p className="mt-1 whitespace-pre-wrap">{details.paymentDetails.purpose}</p>
            </div>
            <div>
              <p className="font-medium text-slate-600">{t('accounting.detail.fields.request_content')}</p>
              <p className="mt-1 whitespace-pre-wrap">{details.paymentDetails.requestContent}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">{t('accounting.detail.sections.breakdown_items')}</h3>
          <ReadOnlyBreakdownGrid items={details.breakdownItems} currencyCode={details.paymentDetails.currencyCode} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">{t('accounting.detail.sections.receipt_files')}</h3>
          {details.receiptFiles.length === 0 ? (
            <p className="text-sm text-slate-500">{t('accounting.detail.receipts.empty')}</p>
          ) : (
            <>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => {
                    details.receiptFiles.forEach((file) => {
                      const link = document.createElement('a');
                      link.href = file.fileUrl;
                      link.download = file.fileName;
                      link.target = '_blank';
                      link.rel = 'noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  {t('accounting.detail.buttons.download_all', { count: details.receiptFiles.length })}
                </button>
              </div>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {details.receiptFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{file.fileName}</p>
                        <p className="text-xs text-slate-500">{file.mimeType} - {formatFileSize(file.fileSize)} - {formatDate(file.uploadedDate)}</p>
                      </div>
                    </div>
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                      {t('accounting.detail.receipts.open')} <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">{t('approver.detail.approval_history')}</h3>
          <ApprovalTimeline logs={approvalLogs} />
        </section>

        {!isPaid && (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-semibold uppercase text-slate-800" htmlFor="accounting-comment">
                {t('accounting.detail.comment.label')}
              </label>
              <textarea
                id="accounting-comment"
                className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('accounting.detail.comment.placeholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-slate-500">{comment.length}/500</p>
            </section>

            <div className="flex justify-end gap-3 pb-6">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(true)}
                className="rounded-lg bg-blue-700 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-800"
              >
                {t('accounting.detail.buttons.mark_as_paid')}
              </button>
            </div>
          </>
        )}

        {isPaid && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 pb-6 text-sm text-emerald-800">
            {t('accounting.detail.paid_info')}
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <PaymentCompletionDialog
          requestNumber={details.requestNumber}
          totalAmount={details.paymentDetails.totalAmount}
          currencyCode={details.paymentDetails.currencyCode}
          submitting={submitting}
          onConfirm={handleConfirmComplete}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-700' : 'bg-red-700'}`}
          role="status"
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}
    </DashboardLayout>
  );
}
