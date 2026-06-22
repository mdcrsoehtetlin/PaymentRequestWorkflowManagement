import React from 'react';
import { PaymentStatus, STATUS_LABELS_EN } from '../../../types';
import { CustomDropdown } from './CustomDropdown';

interface FilterSearchBarProps {
  search: string;
  branch: string;
  dateFrom: string;
  dateTo: string;
  statusId?: number;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onStatusChange: (value?: number) => void;
  onSubmit: () => void;
}

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
  dateFrom,
  dateTo,
  statusId,
  onSearchChange,
  onBranchChange,
  onDateFromChange,
  onDateToChange,
  onStatusChange,
  onSubmit,
}: FilterSearchBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <input
            type="text"
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
            placeholder="Branch name"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span>Submitted From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span>Submitted To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto] items-end">
        <label className="space-y-2 text-sm text-slate-700">
          <span>Status</span>
          <CustomDropdown
            options={statusOptions}
            value={statusId ?? ''}
            placeholder="All Statuses"
            onChange={(val) => onStatusChange(val ? Number(val) : undefined)}
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">Apply filters to update the list</div>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
