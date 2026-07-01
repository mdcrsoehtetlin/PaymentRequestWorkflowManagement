import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import type { ApproverRequestDetailView } from '../types';

interface ApproverActionPanelProps {
  request: ApproverRequestDetailView;
  onApprove: (payload: { comment?: string; accountingUserId?: number }) => Promise<void>;
  onReject: (payload: { comment: string }) => Promise<void>;
}

export function ApproverActionPanel({ request, onApprove, onReject }: ApproverActionPanelProps) {
  const { t } = useTranslation();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({ comment: 'Approved' });
      setIsApproveConfirmOpen(false);
    } catch {
      // Error handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject({ comment: rejectComment });
      setIsConfirmOpen(false);
      setIsRejectOpen(false);
      setRejectComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReject = () => {
    setIsRejectOpen(false);
    setRejectComment('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">{t('approver.action_panel.title')}</h3>
      <p className="text-sm text-slate-500 mb-4">{t('approver.action_panel.description')}</p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!request.canApprove || isSubmitting}
          onClick={() => setIsApproveConfirmOpen(true)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {t('approver.action_panel.buttons.approve')}
        </button>
        <button
          type="button"
          disabled={!request.canReject || isSubmitting}
          onClick={() => setIsRejectOpen(true)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {t('approver.action_panel.buttons.reject')}
        </button>
      </div>

      {isRejectOpen && (
        <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{t('approver.action_panel.rejection_comment')}</p>
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder={t('approver.action_panel.rejection_placeholder')}
          />
          {rejectComment.length > 0 && rejectComment.length < 10 && (
            <p className="text-xs text-red-500">
              {t('approver.action_panel.comment_min_error', { length: rejectComment.length })}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={rejectComment.length < 10 || isSubmitting}
              onClick={() => setIsConfirmOpen(true)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {t('approver.action_panel.buttons.submit_rejection')}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancelReject}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {t('approver.action_panel.buttons.cancel')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleReject}
        title={t('approver.action_panel.confirm_rejection.title')}
        message={t('approver.action_panel.confirm_rejection.message', { comment: rejectComment })}
        confirmLabel={t('approver.action_panel.confirm_rejection.confirm')}
        cancelLabel={t('approver.action_panel.confirm_rejection.cancel')}
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isApproveConfirmOpen}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={handleApprove}
        title={t('approver.action_panel.confirm_approval.title')}
        message={t('approver.action_panel.confirm_approval.message')}
        confirmLabel={t('approver.action_panel.confirm_approval.confirm')}
        cancelLabel={t('approver.action_panel.confirm_approval.cancel')}
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}
