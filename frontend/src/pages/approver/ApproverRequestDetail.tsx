import { Download, ExternalLink, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import type { ApproverRequestDetailView, PaymentBreakdownItem } from './types';
import { ApproverActionPanel } from './components/ApproverActionPanel';
import { ApproverApprovalTimeline } from './components/ApproverApprovalTimeline';
import { ApproverStatusBadge } from './components/ApproverStatusBadge';

interface ApproverRequestDetailProps {
  request: ApproverRequestDetailView | null;
  isLoading: boolean;
  onApprove: (payload: { comment?: string; accountingUserId?: number }) => Promise<void>;
  onReject: (payload: { comment: string }) => Promise<void>;
}

export function ApproverRequestDetail({ request, isLoading, onApprove, onReject }: ApproverRequestDetailProps) {
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
        Select a request from the list to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">Request Number</p>
            <h2 className="text-2xl font-semibold text-slate-900">{request.requestNumber}</h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ApproverStatusBadge statusId={request.statusId} />
            <span className="text-sm text-slate-500">Applied: {formatDate(request.applicationDate)}</span>
          </div>
        </div>

        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Applicant</p>
            <p className="mt-1 text-slate-900">{request.applicant?.fullName ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Employee Number</p>
            <p className="mt-1 text-slate-900 font-semibold">{request.applicant?.employeeNumber ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Department</p>
            <p className="mt-1 text-slate-900">{request.applicant?.department ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Branch</p>
            <p className="mt-1 text-slate-900">{request.applicant?.branch ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-1 text-slate-900">{request.applicant?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Desired Payment Date</p>
            <p className="mt-1 text-slate-900">{formatDate(request.desiredPaymentDate)}</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-4">Purpose</p>
        <p className="mt-2 text-slate-900 whitespace-pre-wrap">{request.purpose}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Breakdown Items</h3>
            {request.breakdownItems && request.breakdownItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium text-right">Qty</th>
                      <th className="pb-2 font-medium text-right">Unit Price</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.breakdownItems.map((item: PaymentBreakdownItem) => (
                      <tr key={item.paymentBreakdownItemId} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-700">{item.lineNumber}</td>
                        <td className="py-2 text-slate-700">{formatDate(item.itemDate)}</td>
                        <td className="py-2 text-slate-700">{item.description}</td>
                        <td className="py-2 text-right text-slate-700">{item.quantity ?? '—'}</td>
                        <td className="py-2 text-right text-slate-700">{item.unitPrice ? formatCurrency(item.unitPrice, request.currencyCode) : '—'}</td>
                        <td className="py-2 text-right font-medium text-slate-900">{formatCurrency(item.amount, request.currencyCode)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-semibold">
                      <td colSpan={5} className="py-2 text-right text-slate-900">Total</td>
                      <td className="py-2 text-right text-slate-900">{formatCurrency(request.totalAmount, request.currencyCode)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No breakdown items.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Receipt Files</h3>
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
                    Download All Receipts ({request.receiptFiles.length})
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
              <p className="text-sm text-slate-500">No receipt files attached.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Approval History</h3>
            <ApproverApprovalTimeline logs={request.approvalLogs} />
          </div>
        </div>

        <ApproverActionPanel request={request} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  );
}
