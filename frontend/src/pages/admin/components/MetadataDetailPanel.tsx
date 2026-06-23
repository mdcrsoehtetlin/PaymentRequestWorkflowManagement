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

interface MetadataDetailPanelProps {
  log: AuditLogRecord;
  onClose: () => void;
}

const ACTION_LABELS: Record<number, string> = {
  1: '作成',
  2: '編集',
  3: '提出',
  4: 'マネージャー確認開始',
  5: 'マネージャー確認',
  6: 'マネージャー差戻し',
  7: '承認者確認開始',
  8: '承認',
  9: '承認者差戻し',
  10: '支払完了',
};

/**
 * @description Docked detail panel displaying audit log metadata.
 * Shows IP address, User Agent, and action details.
 */
export function MetadataDetailPanel({ log, onClose }: MetadataDetailPanelProps) {
  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">ログ詳細</h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500">ログID</p>
          <p className="text-sm font-medium text-slate-900">{log.approvalLogId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">リクエストID</p>
          <p className="text-sm font-medium text-slate-900">
            PRF-{log.paymentRequestId}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">実行者</p>
          <p className="text-sm font-medium text-slate-900">{log.actorName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">アクション</p>
          <p className="text-sm font-medium text-slate-900">
            {ACTION_LABELS[log.actionTypeId] ?? '不明'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">日時</p>
          <p className="text-sm font-medium text-slate-900">
            {new Date(log.timestamp).toLocaleString('ja-JP')}
          </p>
        </div>

        <hr className="border-slate-200" />

        <div>
          <p className="text-xs text-slate-500">IPアドレス</p>
          <p className="text-sm font-medium text-slate-900 font-mono">
            {log.ipAddress}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">ユーザーエージェント</p>
          <p className="text-xs text-slate-700 break-all leading-relaxed">
            {log.userAgent}
          </p>
        </div>

        {log.comment && (
          <>
            <hr className="border-slate-200" />
            <div>
              <p className="text-xs text-slate-500">コメント</p>
              <p className="text-sm text-slate-700">{log.comment}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
