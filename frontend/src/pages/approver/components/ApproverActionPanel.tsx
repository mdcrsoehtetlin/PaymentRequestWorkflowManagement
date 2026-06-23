import { useState } from 'react';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import type { ApproverRequestDetailView } from '../types';

interface ApproverActionPanelProps {
  request: ApproverRequestDetailView;
  onApprove: (payload: { comment?: string; accountingUserId?: number }) => Promise<void>;
  onReject: (payload: { comment: string }) => Promise<void>;
}

export function ApproverActionPanel({ request, onApprove, onReject }: ApproverActionPanelProps) {
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({ comment: 'Approved' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectComment.length < 10) return;
    setIsSubmitting(true);
    try {
      await onReject({ comment: rejectComment });
      setIsRejectOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Actions</h3>
      <p className="text-sm text-slate-500 mb-4">Approve or reject this request.</p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!request.canApprove || isSubmitting}
          onClick={handleApprove}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={!request.canReject || isSubmitting}
          onClick={() => setIsRejectOpen(true)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Reject
        </button>
      </div>

      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject this request?"
        message="Please enter a rejection comment (minimum 10 characters)."
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
      {isRejectOpen && (
        <div className="mt-3">
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Enter rejection reason..."
          />
        </div>
      )}
    </div>
  );
}
