import { useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';

import { BranchAlertBanner } from './components/BranchAlertBanner';
import { PaymentCompletionDialog } from './components/PaymentCompletionDialog';
import { ReadOnlyBreakdownGrid } from './components/ReadOnlyBreakdownGrid';
import {
  completePayment,
  getPaymentRequestDetails,
  type AccountingPaymentDetail,
} from './services/accounting.service';
import { ACTION_LABELS_EN, type ApprovalActionType } from '../../types';

interface Props {
  requestId: number;
  onClose: () => void;
  onComplete: () => void;
}

const formatDate = (value: string): string => new Date(value).toLocaleDateString();

const formatDateTime = (value: string): string => new Date(value).toLocaleString();

const formatFileSize = (value: string): string => {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '-';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Payment detail review keeps accounting edits out of the audit surface while
 * still exposing the full request context required before payment completion.
 */
export const PaymentDetailModal: FC<Props> = ({
  requestId,
  onClose,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<AccountingPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await getPaymentRequestDetails(requestId);

        if (isMounted) {
          setDetails(data);
        }
      } catch {
        if (isMounted) {
          setToast({ message: t('accounting.errors.load_details'), type: 'error' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [requestId, t]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const gridSum = useMemo(
    () =>
      details?.breakdownItems.reduce(
        (total, item) => total + Number(item.amount),
        0,
      ) ?? 0,
    [details],
  );

  const totalAmount = Number(details?.paymentDetails.totalAmount ?? 0);
  const isMismatched = details !== null && Math.abs(gridSum - totalAmount) > 0.01;
  const isMissingReceipts =
    details !== null && details.hasReceipt && details.receiptFiles.length === 0;

  const handleConfirmComplete = async (): Promise<void> => {
    try {
      setSubmitting(true);
      await completePayment(requestId, comment.trim() || undefined);
      setShowConfirmDialog(false);
      setToast({ message: t('accounting.success.paid'), type: 'success' });
      window.setTimeout(() => onComplete(), 1200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('accounting.errors.complete_payment');
      setShowConfirmDialog(false);
      setToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !details) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="flex w-full max-w-4xl items-center gap-3 rounded-lg bg-white p-8 shadow-2xl">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          <span className="text-sm text-slate-600">{t('accounting.detail.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accounting-payment-detail-title"
      >
        <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div>
              <h2
                id="accounting-payment-detail-title"
                className="text-xl font-bold text-slate-900"
              >
                {details.requestNumber}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('accounting.detail.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('accounting.detail.close_aria')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <BranchAlertBanner branch={details.applicant.branch} />

            {isMismatched && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{t('accounting.detail.alerts.total_mismatch')}</p>
                  <p className="mt-1 text-sm">
                    {t('accounting.detail.alerts.total_mismatch_detail', { headerTotal: totalAmount.toLocaleString(), breakdownSum: gridSum.toLocaleString() })}{' '}
                    {details.paymentDetails.currencyCode}.
                  </p>
                </div>
              </div>
            )}

            {isMissingReceipts && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{t('accounting.detail.alerts.missing_receipts')}</p>
                  <p className="mt-1 text-sm">
                    {t('accounting.detail.alerts.missing_receipts_detail')}
                  </p>
                </div>
              </div>
            )}

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  {t('accounting.detail.sections.applicant')}
                </h3>
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

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  {t('accounting.detail.sections.payment')}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-32 text-slate-500">{t('accounting.detail.fields.total')}</dt>
                    <dd className="font-bold text-slate-900">
                      {totalAmount.toLocaleString()} {details.paymentDetails.currencyCode}
                    </dd>
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
                    <dd className="text-slate-900">
                      {formatDate(details.paymentDetails.applicationDate)}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-32 text-slate-500">{t('accounting.detail.fields.desired_date')}</dt>
                    <dd className="text-slate-900">
                      {formatDate(details.paymentDetails.desiredPaymentDate)}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-32 text-slate-500">{t('accounting.detail.fields.bank_info')}</dt>
                    <dd className="text-slate-900">
                      {details.paymentDetails.bankAccountInfo ?? '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">
                {t('accounting.detail.sections.request_context')}
              </h3>
              <div className="space-y-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-800">
                <div>
                  <p className="font-medium text-slate-600">{t('accounting.detail.fields.purpose')}</p>
                  <p className="mt-1 whitespace-pre-wrap">{details.paymentDetails.purpose}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-600">{t('accounting.detail.fields.request_content')}</p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {details.paymentDetails.requestContent}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">
                {t('accounting.detail.sections.breakdown_items')}
              </h3>
              <ReadOnlyBreakdownGrid
                items={details.breakdownItems}
                currencyCode={details.paymentDetails.currencyCode}
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">
                {t('accounting.detail.sections.receipt_files')}
              </h3>
              <div className="rounded-lg border border-slate-200">
                {details.receiptFiles.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">{t('accounting.detail.receipts.empty')}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {details.receiptFiles.map((file) => (
                      <li key={file.id} className="flex items-center justify-between gap-4 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 flex-shrink-0 text-slate-500" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {file.mimeType} - {formatFileSize(file.fileSize)} -{' '}
                              {formatDate(file.uploadedDate)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {t('accounting.detail.receipts.open')}
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">
                {t('accounting.detail.sections.approval_timeline')}
              </h3>
              <ol className="space-y-3 rounded-lg border border-slate-200 p-4">
                {details.approvalTimeline.length === 0 ? (
                  <li className="text-sm text-slate-500">{t('accounting.detail.timeline.empty')}</li>
                ) : (
                  details.approvalTimeline.map((item) => (
                    <li key={item.id} className="border-l-2 border-blue-200 pl-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {ACTION_LABELS_EN[item.actionTypeId as ApprovalActionType] ?? t('accounting.detail.timeline.action_label', { actionTypeId: item.actionTypeId })}
                        </p>
                        <time className="text-xs text-slate-500" dateTime={item.timestamp}>
                          {formatDateTime(item.timestamp)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.user.fullName} ({item.user.employeeNumber})
                      </p>
                      {item.comment && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                          {item.comment}
                        </p>
                      )}
                    </li>
                  ))
                )}
              </ol>
            </section>

            <section>
              <label
                className="mb-2 block text-sm font-semibold uppercase text-slate-800"
                htmlFor="accounting-comment"
              >
                {t('accounting.detail.comment.label')}
              </label>
              <textarea
                id="accounting-comment"
                className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('accounting.detail.comment.placeholder')}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {comment.length}/500
              </p>
            </section>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('accounting.detail.buttons.back_to_list')}
              </button>
              {details.receiptFiles.length > 0 && (
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t('accounting.detail.buttons.download_all', { count: details.receiptFiles.length })}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-5 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('accounting.detail.buttons.close')}
              </button>
              <button
                id="open-complete-payment-dialog"
                type="button"
                onClick={() => setShowConfirmDialog(true)}
                className="rounded-lg bg-blue-700 px-5 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('accounting.detail.buttons.mark_as_paid')}
              </button>
            </div>
          </div>
        </div>
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
          className={`fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-700' : 'bg-red-700'
          }`}
          role="status"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5" aria-hidden="true" />
          )}
          {toast.message}
        </div>
      )}
    </>
  );
};
