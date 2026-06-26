import type { FC } from 'react';
import type { PaymentRequest } from '../services/accounting.service';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { formatDate } from '../../../utils/format';

interface Props {
  data: PaymentRequest[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectRequest: (id: number) => void;
}

export const AccountingQueueTable: FC<Props> = ({
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onSelectRequest,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Loading queue...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Request No.</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Applicant</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Branch</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Application Date</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Desired Date</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  No approved payment requests pending.
                </td>
              </tr>
            ) : (
              data.map((req) => (
                <tr key={req.paymentRequestId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req.paymentRequestId)}
                      className="font-medium text-blue-700 hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {req.requestNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{req.applicantName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{req.branch}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(req.applicationDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(req.desiredPaymentDate)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {Number(req.totalAmount).toLocaleString()} {req.currencyCode}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge statusId={req.statusId} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req.paymentRequestId)}
                      className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center text-sm text-slate-500">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="mr-2 rounded border-slate-300 bg-white text-sm text-slate-900"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
            Showing
            <span className="mx-2 font-medium text-slate-900">
              {Math.min((page - 1) * pageSize + 1, total)}
            </span>
            -
            <span className="mx-2 font-medium text-slate-900">
              {Math.min(page * pageSize, total)}
            </span>
            of <span className="mx-1 font-medium text-slate-900">{total}</span> results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 text-sm text-slate-600">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
