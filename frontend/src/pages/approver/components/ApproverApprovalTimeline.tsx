import React from 'react';
import { formatDateTime } from '../../../utils/format';
import { ACTION_BADGE_COLORS } from '../../../utils/constants';

const ACTION_LABELS_EN: Record<number, string> = {
  1: 'Created',
  2: 'Draft Saved',
  3: 'Rejected',
  4: 'Returned',
  5: 'Verified',
  6: 'Submitted',
  7: 'Review Started',
  8: 'Approved',
  9: 'Rejected',
  10: 'Payment Completed',
  11: 'Cancelled',
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
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate-500 italic">No approval history available.</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
      {logs.map((log) => {
        const isRejection = log.actionTypeId === 3 || log.actionTypeId === 9;
        const badgeColor = ACTION_BADGE_COLORS[log.actionTypeId] || 'bg-slate-100 text-slate-800';
        const actionLabel = ACTION_LABELS_EN[log.actionTypeId] || 'Unknown';

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
