<<<<<<< HEAD
=======
import type { ApprovalLogWithUser } from '../../types';
import { ApprovalActionType } from '../../types';
>>>>>>> df0b80fd5be9df331023b22ce1a766501a4b09af
import { formatDateTime } from '../../utils/format';
import {
  ACTION_LABELS_JP,
  ACTION_BADGE_COLORS,
  type ApprovalLogWithUser,
  type ApprovalActionType
} from '../../types';

interface ApprovalTimelineProps {
  logs: ApprovalLogWithUser[];
}

export function ApprovalTimeline({ logs }: ApprovalTimelineProps) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate-500 italic">承認履歴はありません</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
      {logs.map((log) => {
        const isRejection = log.actionTypeId === 6 || log.actionTypeId === 9; // MGR_REJECTED or APPR_REJECTED
        const badgeColor = ACTION_BADGE_COLORS[log.actionTypeId as ApprovalActionType] || 'bg-slate-100 text-slate-800';
        const actionLabel = ACTION_LABELS_JP[log.actionTypeId as ApprovalActionType] || '不明';

        return (
          <div key={log.approvalLogId} className="relative pl-6">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300"></div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-semibold text-slate-900 mr-2">
                  {log.actionTakenByUser?.fullName || 'システム'}
                </span>
                <span className="text-xs text-slate-500">
                  {log.actionTakenByUser?.branch ? `(${log.actionTakenByUser.branch})` : ''}
                </span>
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
