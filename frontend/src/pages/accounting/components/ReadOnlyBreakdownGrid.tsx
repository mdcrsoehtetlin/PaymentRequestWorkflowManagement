import type { FC } from 'react';

import type { AccountingBreakdownItem } from '../services/accounting.service';

interface Props {
  items: AccountingBreakdownItem[];
  currencyCode: string;
}

const formatDate = (value: string): string => new Date(value).toLocaleDateString();

export const ReadOnlyBreakdownGrid: FC<Props> = ({ items, currencyCode }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-12 p-3 font-semibold text-slate-700">#</th>
            <th className="p-3 font-semibold text-slate-700">Date</th>
            <th className="p-3 font-semibold text-slate-700">Description</th>
            <th className="p-3 text-right font-semibold text-slate-700">Qty</th>
            <th className="p-3 text-right font-semibold text-slate-700">Unit Price</th>
            <th className="p-3 text-right font-semibold text-slate-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-slate-500">
                No breakdown items recorded.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 text-slate-500">{item.lineNumber}</td>
                <td className="p-3 text-slate-700">{formatDate(item.itemDate)}</td>
                <td className="p-3 text-slate-900">{item.description}</td>
                <td className="p-3 text-right text-slate-700">
                  {item.quantity ?? '-'}
                </td>
                <td className="p-3 text-right text-slate-700">
                  {item.unitPrice
                    ? `${Number(item.unitPrice).toLocaleString()} ${currencyCode}`
                    : '-'}
                </td>
                <td className="p-3 text-right font-medium text-slate-900">
                  {Number(item.amount).toLocaleString()} {currencyCode}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
