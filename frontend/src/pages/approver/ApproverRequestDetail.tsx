import { Download, ExternalLink, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/format';
import type { ApproverRequestDetailView, PaymentBreakdownItem } from './types';
import { ApproverActionPanel } from './components/ApproverActionPanel';
import { ApprovalTimeline } from '../../components/shared/ApprovalTimeline';
import { ApproverStatusBadge } from './components/ApproverStatusBadge';

function approverCurrency(amount: string | number, currencyCode = 'MMK'): string {
  const num = Number(amount);
  if (isNaN(num)) return `0 ${currencyCode}`;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencyCode}`;
}

interface ApproverRequestDetailProps {
  request: ApproverRequestDetailView | null;
  isLoading: boolean;
  onApprove: (payload: { comment?: string; accountingUserId?: number }) => Promise<void>;
  onReject: (payload: { comment: string }) => Promise<void>;
}

export function ApproverRequestDetail({ request, isLoading, onApprove, onReject }: ApproverRequestDetailProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-slate-100 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
        {t('approver.detail.empty_state')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.request_number')}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{request.requestNumber}</h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ApproverStatusBadge statusId={request.statusId} />
            <span className="text-sm text-slate-500">{t('approver.detail.fields.applied')} {formatDate(request.applicationDate)}</span>
          </div>
        </div>

        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.applicant')}</p>
            <p className="mt-1 text-slate-900">{request.applicant?.fullName ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.employee_number')}</p>
            <p className="mt-1 text-slate-900 font-semibold">{request.applicant?.employeeNumber ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.department')}</p>
            <p className="mt-1 text-slate-900">{request.applicant?.department ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.branch')}</p>
            <p className="mt-1 text-slate-900">{request.applicant?.branch ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.email')}</p>
            <p className="mt-1 text-slate-900">{request.applicant?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('approver.detail.fields.desired_payment_date')}</p>
            <p className="mt-1 text-slate-900">{formatDate(request.desiredPaymentDate)}</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-4">{t('approver.detail.fields.purpose')}</p>
        <p className="mt-2 text-slate-900 whitespace-pre-wrap">{request.purpose}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('approver.detail.breakdown.title')}</h3>
            {request.breakdownItems && request.breakdownItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-2 font-medium">{t('approver.detail.breakdown.columns.no')}</th>
                      <th className="pb-2 font-medium">{t('approver.detail.breakdown.columns.date')}</th>
                      <th className="pb-2 font-medium">{t('approver.detail.breakdown.columns.description')}</th>
                      <th className="pb-2 font-medium text-right">{t('approver.detail.breakdown.columns.qty')}</th>
                      <th className="pb-2 font-medium text-right">{t('approver.detail.breakdown.columns.unit_price')}</th>
                      <th className="pb-2 font-medium text-right">{t('approver.detail.breakdown.columns.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.breakdownItems.map((item: PaymentBreakdownItem) => (
                      <tr key={item.paymentBreakdownItemId} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-700">{item.lineNumber}</td>
                        <td className="py-2 text-slate-700">{formatDate(item.itemDate)}</td>
                        <td className="py-2 text-slate-700">{item.description}</td>
                        <td className="py-2 text-right text-slate-700">{item.quantity ?? '—'}</td>
                        <td className="py-2 text-right text-slate-700">{item.unitPrice ? approverCurrency(item.unitPrice, request.currencyCode) : '—'}</td>
                        <td className="py-2 text-right font-medium text-slate-900">{approverCurrency(item.amount, request.currencyCode)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-semibold">
                      <td colSpan={5} className="py-2 text-right text-slate-900">{t('approver.detail.breakdown.total')}</td>
                      <td className="py-2 text-right text-slate-900">{approverCurrency(request.totalAmount, request.currencyCode)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t('approver.detail.breakdown.empty')}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('approver.detail.receipts.title')}</h3>
            {request.receiptFiles && request.receiptFiles.length > 0 ? (
              <>
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      request.receiptFiles!.forEach((file) => {
                        const link = document.createElement('a');
                        link.href = file.fileStoragePath;
                        link.download = file.originalFileName;
                        link.target = '_blank';
                        link.rel = 'noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    {t('approver.detail.receipts.download_all', { count: request.receiptFiles.length })}
                  </button>
                </div>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {request.receiptFiles.map((file) => (
                    <li key={file.receiptFileId} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 flex-shrink-0 text-slate-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.originalFileName}</p>
                          <p className="text-xs text-slate-500">{file.mimeType} - {(parseInt(file.fileSize) / 1024).toFixed(1)} KB - {formatDate(file.uploadedDate)}</p>
                        </div>
                      </div>
                      <a href={file.fileStoragePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                        Open <ExternalLink className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate-500">{t('approver.detail.receipts.empty')}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('approver.detail.approval_history')}</h3>
            <ApprovalTimeline logs={request.approvalLogs} />
          </div>
        </div>

        <ApproverActionPanel request={request} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  );
}
