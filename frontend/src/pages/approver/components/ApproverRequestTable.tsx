import { DataTable } from '../../../components/shared/DataTable';
import { ApproverStatusBadge } from './ApproverStatusBadge';
import { formatCurrency, formatDate } from '../../../utils/format';
import type { ApproverRequestListItem } from '../types';

interface ApproverRequestTableProps {
  data: ApproverRequestListItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onRowClick: (item: ApproverRequestListItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortChange: (sortBy: string) => void;
}

export function ApproverRequestTable({
  data,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  sortBy,
  sortOrder,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: ApproverRequestTableProps) {
  const columns = [
    {
      key: 'requestNumber',
      header: 'Request No.',
      sortable: true,
      width: '13%',
      render: (value: unknown) => (
        <span className="text-blue-700 font-medium hover:text-blue-900 hover:underline cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      key: 'applicantFullName',
      header: 'Applicant',
      render: (value: unknown) => (
        <span className="text-sm text-slate-700">{value as string}</span>
      ),
      width: '16%',
    },
    {
      key: 'applicantBranch',
      header: 'Branch',
      render: (value: unknown) => (
        <span className="text-sm text-slate-700">{value as string}</span>
      ),
      width: '12%',
    },
    { key: 'applicationDate', header: 'Application Date', sortable: true, width: '13%', render: (value: unknown) => formatDate(value as string) },
    { key: 'desiredPaymentDate', header: 'Desired Date', sortable: true, width: '12%', render: (value: unknown) => formatDate(value as string) },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      width: '14%',
      render: (_value: unknown, row: ApproverRequestListItem) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.totalAmount, row.currencyCode)}</span>
      ),
    },
    { key: 'statusId', header: 'Status', sortable: true, width: '12%', render: (value: unknown) => <ApproverStatusBadge statusId={value as number} size="sm" /> },
    {
      key: 'action',
      header: 'Action',
      width: '8%',
      render: (_value: unknown, row: ApproverRequestListItem) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRowClick(row); }}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Details
        </button>
      ),
    },
  ];

  const rows = data.map((item) => ({
    ...item,
    applicantFullName: item.applicant.fullName,
    applicantBranch: item.applicant.branch,
  }));

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      onRowClick={onRowClick}
      pagination={{
        page,
        pageSize,
        totalItems,
        totalPages,
        onPageChange,
        onPageSizeChange,
      }}
      sorting={{
        sortBy,
        sortOrder,
        onSortChange,
      }}
      emptyMessage="No pending requests"
    />
  );
}
