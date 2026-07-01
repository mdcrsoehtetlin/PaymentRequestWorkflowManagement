import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface AuditLogRecord {
  approvalLogId: string;
  paymentRequestId: number;
  requestNumber: string | null;
  actorName: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface MetadataDetailPanelProps {
  log: AuditLogRecord;
  onClose: () => void;
}

const ACTION_TYPE_MAP: Record<number, string> = {
  1: 'created',
  2: 'edited',
  3: 'submitted',
  4: 'mgr_review_start',
  5: 'mgr_verified',
  6: 'mgr_rejected',
  7: 'appr_review_start',
  8: 'approved',
  9: 'appr_rejected',
  10: 'payment_completed',
};

/**
 * @description Docked detail panel displaying audit log metadata.
 * Shows IP address, User Agent, and action details.
 */
export function MetadataDetailPanel({ log, onClose }: MetadataDetailPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{t('admin.metadata_detail.title')}</h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.log_id')}</p>
          <p className="text-sm font-medium text-slate-900">{log.approvalLogId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.request_number')}</p>
          <p className="text-sm font-medium text-slate-900">
            {log.requestNumber ?? 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.actor')}</p>
          <p className="text-sm font-medium text-slate-900">{log.actorName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.action')}</p>
          <p className="text-sm font-medium text-slate-900">
            {t(`common.action.${ACTION_TYPE_MAP[log.actionTypeId] ?? 'unknown'}`)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.date_time')}</p>
          <p className="text-sm font-medium text-slate-900">
            {new Date(log.timestamp).toLocaleString('ja-JP')}
          </p>
        </div>

        <hr className="border-slate-200" />

        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.ip_address')}</p>
          <p className="text-sm font-medium text-slate-900 font-mono">
            {log.ipAddress}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.user_agent')}</p>
          <p className="text-xs text-slate-700 break-all leading-relaxed">
            {log.userAgent}
          </p>
        </div>

        {log.comment && (
          <>
            <hr className="border-slate-200" />
            <div>
              <p className="text-xs text-slate-500">{t('admin.metadata_detail.labels.comment')}</p>
              <p className="text-sm text-slate-700">{log.comment}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
