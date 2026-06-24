import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BreakdownItem } from '../utils/calculate-total';

interface BreakdownItemTableProps {
  items: BreakdownItem[];
  onChange: (items: BreakdownItem[]) => void;
}

export const BreakdownItemTable: React.FC<BreakdownItemTableProps> = ({ items, onChange }) => {
  const handleAddBreakdown = () => {
    if (items.length >= 15) return;
    onChange([...items, { department: '', projectName: '', description: '', amount: '' }]);
  };

  const handleRemoveBreakdown = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleBreakdownChange = (index: number, field: keyof BreakdownItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900">Payment Breakdown</h3>
        <button
          type="button"
          onClick={handleAddBreakdown}
          disabled={items.length >= 15}
          className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:hover:text-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.department}
                    onChange={(e) => handleBreakdownChange(index, 'department', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="Dept..."
                    required
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.projectName}
                    onChange={(e) => handleBreakdownChange(index, 'projectName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="Project..."
                    required
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleBreakdownChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="Desc..."
                    required
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleBreakdownChange(index, 'amount', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveBreakdown(index)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
