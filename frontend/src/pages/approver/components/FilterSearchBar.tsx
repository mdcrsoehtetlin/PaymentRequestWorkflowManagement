import { Search } from 'lucide-react';
import { PaymentStatus } from '../../../types';
import { STATUS_LABELS_EN } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface FilterSearchBarProps {
  search: string;
  branch: string;
  desiredDate: string;
  statusId?: number;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onDesiredDateChange: (value: string) => void;
  onStatusChange: (value?: number) => void;
  onSubmit: () => void;
  onClear: () => void;
}

const branchOptions = [
  { value: '', label: 'All Branches' },
  { value: 'Yangon', label: 'Yangon' },
  { value: 'Mandalay', label: 'Mandalay' },
  { value: 'Naypyidaw', label: 'Naypyidaw' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: PaymentStatus.SUBMITTED_APPROVER, label: STATUS_LABELS_EN[PaymentStatus.SUBMITTED_APPROVER] },
  { value: PaymentStatus.APPROVER_REVIEWING, label: STATUS_LABELS_EN[PaymentStatus.APPROVER_REVIEWING] },
  { value: PaymentStatus.APPROVED, label: STATUS_LABELS_EN[PaymentStatus.APPROVED] },
  { value: PaymentStatus.REJECTED_APPROVER, label: STATUS_LABELS_EN[PaymentStatus.REJECTED_APPROVER] },
];

export function FilterSearchBar({
  search,
  branch,
  desiredDate,
  statusId,
  onSearchChange,
  onBranchChange,
  onDesiredDateChange,
  onStatusChange,
  onSubmit,
  onClear,
}: FilterSearchBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div
        className="grid gap-4 items-end"
        style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto' }}
      >
        <label className="space-y-2 text-sm text-slate-700">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Request number, applicant, purpose"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span>Branch</span>
          <CustomDropdown
            options={branchOptions}
            value={branch}
            placeholder="All Branches"
            onChange={(val) => onBranchChange(String(val ?? ''))}
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span>Desired Date</span>
          <input
            type="date"
            value={desiredDate}
            onChange={(e) => onDesiredDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span>Status</span>
          <CustomDropdown
            options={statusOptions}
            value={statusId ?? ''}
            placeholder="All Statuses"
            onChange={(val) => onStatusChange(val ? Number(val) : undefined)}
          />
        </label>

        <div className="flex items-center gap-3 pb-0.5">
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
