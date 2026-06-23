import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  requestNumber: string;
  totalAmount: string;
  currencyCode: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

/**
 * Payment completion is terminal, so accounting users get a custom
 * confirmation step before writing the audit transition.
 */
export const PaymentCompletionDialog: React.FC<Props> = ({
  requestNumber,
  totalAmount,
  currencyCode,
  onConfirm,
  onCancel,
  submitting,
}) => {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-completion-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
          <h2 id="payment-completion-title" className="text-lg font-bold text-slate-900">
            Confirm Payment Completion
          </h2>
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-1 text-sm text-slate-600">Request</p>
          <p className="text-base font-semibold text-slate-900">{requestNumber}</p>
          <p className="mb-1 mt-2 text-sm text-slate-600">Amount to be paid</p>
          <p className="text-xl font-bold text-slate-900">
            {Number(totalAmount).toLocaleString()} {currencyCode}
          </p>
        </div>

        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              <strong>This action is irreversible.</strong> Once marked as paid, the request
              status cannot be changed. Ensure all amounts and receipts have been verified.
            </span>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-5 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            id="confirm-complete-payment"
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`rounded-lg px-5 py-2 font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              submitting
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing...
              </span>
            ) : (
              'Confirm and Mark as Paid'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
