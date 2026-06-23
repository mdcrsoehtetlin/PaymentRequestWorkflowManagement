import { X } from 'lucide-react';

interface AuditLogRecord {
  approvalLogId: string;
  paymentRequestId: number;
  actorName: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

import { formatDateTime } from '../../../utils/format';

interface MetadataDetailPanelProps {
  log: AuditLogRecord;
  onClose: () => void;
}

const ACTION_LABELS: Record<number, string> = {
  1: 'Created',
  2: 'Edited',
  3: 'Submitted',
  4: 'Manager Review Started',
  5: 'Manager Verified',
  6: 'Rejected by Manager',
  7: 'Approver Review Started',
  8: 'Approved',
  9: 'Rejected by Approver',
  10: 'Payment Completed',
};

/**
 * @description Docked detail panel displaying audit log metadata.
 * Shows IP address, User Agent, and action details.
 */
export function MetadataDetailPanel({ log, onClose }: MetadataDetailPanelProps) {
  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Log Details</h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500">Log ID</p>
          <p className="text-sm font-medium text-slate-900">{log.approvalLogId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Request ID</p>
          <p className="text-sm font-medium text-slate-900">
            PRF-{log.paymentRequestId}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Actor</p>
          <p className="text-sm font-medium text-slate-900">{log.actorName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Action</p>
          <p className="text-sm font-medium text-slate-900">
            {ACTION_LABELS[log.actionTypeId] ?? 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Timestamp</p>
          <p className="text-sm font-medium text-slate-900">
            {formatDateTime(log.timestamp)}
          </p>
        </div>

        <hr className="border-slate-200" />

        <div>
          <p className="text-xs text-slate-500">IP Address</p>
          <p className="text-sm font-medium text-slate-900 font-mono">
            {log.ipAddress}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">User Agent</p>
          <p className="text-xs text-slate-700 break-all leading-relaxed">
            {log.userAgent}
          </p>
        </div>

        {log.comment && (
          <>
            <hr className="border-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Comment</p>
              <p className="text-sm text-slate-700">{log.comment}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
