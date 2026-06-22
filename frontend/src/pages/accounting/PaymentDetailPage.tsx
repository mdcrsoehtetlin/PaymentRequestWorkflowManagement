import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  completePayment,
  getPaymentRequestDetails,
  type AccountingPaymentDetail,
} from './services/accounting.service';
import { ACTION_LABELS_EN, type ApprovalActionType } from '../../types';

const formatDate = (value: string): string => new Date(value).toLocaleDateString();

const formatDateTime = (value: string): string => new Date(value).toLocaleString();

const formatFileSize = (value: string): string => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        if (isMounted) setToast({ message: 'Failed to load request details.', type: 'error' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [requestId]);

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

  const handleConfirmComplete = async () => {
    try {
      setSubmitting(true);
      await completePayment(requestId, comment.trim() || undefined);
      setShowConfirmDialog(false);
      setToast({ message: 'Payment marked as PAID successfully.', type: 'success' });
      window.setTimeout(() => navigate('/accounting'), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete payment.';
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
          <span className="ml-3 text-slate-600">Loading payment details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-slate-600">Payment request not found.</p>
          <button onClick={() => navigate('/accounting')} className="mt-4 text-blue-700 hover:underline">
            Back to Dashboard
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
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{details.requestNumber}</h1>
        </div>
      </div>

      <BranchAlertBanner branch={details.applicant.branch} />

      {isMismatched && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Total Mismatch Detected</p>
            <p className="mt-1 text-sm">
              Header total ({totalAmount.toLocaleString()}) does not match breakdown sum ({gridSum.toLocaleString()}) {details.paymentDetails.currencyCode}.
            </p>
          </div>
        </div>
      )}

      {isMissingReceipts && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Missing Receipts</p>
            <p className="mt-1 text-sm">This request is flagged as requiring receipts, but no active digital receipt files are attached.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">Applicant</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{details.applicant.fullName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">Employee</dt>
                <dd className="text-slate-900">{details.applicant.employeeNumber}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">Branch</dt>
                <dd className="text-slate-900">{details.applicant.branch}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">Department</dt>
                <dd className="text-slate-900">{details.applicant.department ?? '-'}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 text-slate-500">Email</dt>
                <dd className="break-all text-slate-900">{details.applicant.email}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">Payment</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Total</dt>
                <dd className="font-bold text-slate-900">{totalAmount.toLocaleString()} {details.paymentDetails.currencyCode}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Method</dt>
                <dd className="text-slate-900">{details.paymentDetails.paymentMethodName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Type</dt>
                <dd className="text-slate-900">{details.paymentDetails.paymentTypeName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Application</dt>
                <dd className="text-slate-900">{formatDate(details.paymentDetails.applicationDate)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Desired Date</dt>
                <dd className="text-slate-900">{formatDate(details.paymentDetails.desiredPaymentDate)}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 text-slate-500">Bank Info</dt>
                <dd className="text-slate-900">{details.paymentDetails.bankAccountInfo ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">Request Context</h3>
          <div className="space-y-3 text-sm text-slate-800">
            <div>
              <p className="font-medium text-slate-600">Purpose</p>
              <p className="mt-1 whitespace-pre-wrap">{details.paymentDetails.purpose}</p>
            </div>
            <div>
              <p className="font-medium text-slate-600">Request Content</p>
              <p className="mt-1 whitespace-pre-wrap">{details.paymentDetails.requestContent}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">Breakdown Items</h3>
          <ReadOnlyBreakdownGrid items={details.breakdownItems} currencyCode={details.paymentDetails.currencyCode} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">Receipt Files</h3>
          {details.receiptFiles.length === 0 ? (
            <p className="text-sm text-slate-500">No receipt files attached.</p>
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
                  Download All Receipts ({details.receiptFiles.length})
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
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-800">Approval Timeline</h3>
          <ol className="space-y-3">
            {details.approvalTimeline.length === 0 ? (
              <li className="text-sm text-slate-500">No approval history recorded.</li>
            ) : (
              details.approvalTimeline.map((item) => (
                <li key={item.id} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {ACTION_LABELS_EN[item.actionTypeId as ApprovalActionType] ?? `Action ${item.actionTypeId}`}
                    </p>
                    <time className="text-xs text-slate-500" dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.user.fullName} ({item.user.employeeNumber})</p>
                  {item.comment && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{item.comment}</p>}
                </li>
              ))
            )}
          </ol>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-semibold uppercase text-slate-800" htmlFor="accounting-comment">
            Accounting Comment (Optional)
          </label>
          <textarea
            id="accounting-comment"
            className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add a comment to be recorded in the audit log..."
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
            Mark as Paid
          </button>
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
