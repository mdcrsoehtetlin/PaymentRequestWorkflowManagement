import { useTranslation } from 'react-i18next';
import type { ApprovalActionType, ApprovalLogWithUser } from '../../types';
import { formatDateTime } from '../../utils/format';
import { ACTION_BADGE_COLORS } from '../../utils/constants';

const ACTION_I18N_KEY: Record<number, string> = {
  1: 'common.action.created',
  2: 'common.action.edited',
  3: 'common.action.submitted',
  4: 'common.action.mgr_review_start',
  5: 'common.action.mgr_verified',
  6: 'common.action.mgr_rejected',
  7: 'common.action.appr_review_start',
  8: 'common.action.approved',
  9: 'common.action.appr_rejected',
  10: 'common.action.payment_completed',
};

const ROLE_NAME_I18N: Record<number, string> = {
  1: 'common.role.applicant',
  2: 'common.role.manager',
  3: 'common.role.approver',
  4: 'common.role.accounting',
};

interface ApprovalTimelineProps {
  logs: ApprovalLogWithUser[];
}

export function ApprovalTimeline({ logs }: ApprovalTimelineProps) {
  const { t } = useTranslation();

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate-500 italic">{t('common.timeline.empty')}</p>;
  }

  const getActionLabel = (log: ApprovalLogWithUser): string => {
    if (log.actionTypeId === 3) {
      if (log.newStatusId === 2) {
        return t('common.action.submitted_to_manager');
      } else if (log.newStatusId === 6) {
        return t('common.action.submitted_to_approver');
      }
    }
    const i18nKey = ACTION_I18N_KEY[log.actionTypeId];
    return i18nKey ? t(i18nKey) : t('common.action.created');
  };

  const getRoleLabel = (roleId: number | null | undefined): string => {
    if (roleId == null) return '';
    const i18nKey = ROLE_NAME_I18N[roleId];
    return i18nKey ? t(i18nKey) : '';
  };

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
      {logs.map((log) => {
        const isRejection = log.actionTypeId === 6 || log.actionTypeId === 9;
        const badgeColor = ACTION_BADGE_COLORS[log.actionTypeId as ApprovalActionType] || 'bg-slate-100 text-slate-800';
        const actionLabel = getActionLabel(log);

        return (
          <div key={log.approvalLogId} className="relative pl-6">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-500 border-2 border-slate-500" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-semibold text-slate-900">
                  {log.actionTakenByUser.fullName}
                </span>
                {log.actionTakenByUser.roleId != null && (
                  <span className="text-sm text-slate-500 ml-1">
                    ({getRoleLabel(log.actionTakenByUser.roleId)})
                  </span>
                )}
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
