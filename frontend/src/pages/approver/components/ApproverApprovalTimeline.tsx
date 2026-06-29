import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../utils/format';
import { ACTION_BADGE_COLORS } from '../../../utils/constants';
import type { ApprovalActionType } from '../../../types';

const ACTION_I18N_KEY: Record<number, string> = {
  1: 'approver.action.created',
  2: 'approver.action.draft_saved',
  3: 'approver.action.mgr_rejected',
  4: 'approver.action.mgr_rejected',
  5: 'approver.action.mgr_verified',
  6: 'approver.action.submitted',
  7: 'approver.action.appr_review_start',
  8: 'approver.action.approved',
  9: 'approver.action.appr_rejected',
  10: 'approver.action.payment_completed',
  11: 'approver.action.cancelled',
};

interface TimelineLog {
  approvalLogId: string;
  actionTypeId: number;
  comment: string | null;
  timestamp: string;
  actionTakenByUser: {
    fullName: string;
    branch?: string;
  };
}

interface ApproverApprovalTimelineProps {
  logs: TimelineLog[];
}

export function ApproverApprovalTimeline({ logs }: ApproverApprovalTimelineProps) {
  const { t } = useTranslation();

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate-500 italic">{t('approver.timeline.empty')}</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
      {logs.map((log) => {
        const isRejection = log.actionTypeId === 3 || log.actionTypeId === 9;
        const badgeColor = ACTION_BADGE_COLORS[log.actionTypeId as ApprovalActionType] || 'bg-slate-100 text-slate-800';
        const i18nKey = ACTION_I18N_KEY[log.actionTypeId];
        const actionLabel = i18nKey ? t(i18nKey) : t('approver.action.created');

        return (
          <div key={log.approvalLogId} className="relative pl-6">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-semibold text-slate-900 mr-2">{log.actionTakenByUser.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                  {actionLabel}
                </span>
                <time className="text-xs text-slate-500 font-mono">
                  {formatDateTime(log.timestamp)}
                </time>
              </div>
            </div>

            {log.comment && (
              <div className={`mt-2 p-3 rounded-md text-sm ${isRejection ? 'bg-red-50 border-l-4 border-red-400 text-red-900' : 'bg-slate-50 text-slate-700'}`}>
                {log.comment}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
