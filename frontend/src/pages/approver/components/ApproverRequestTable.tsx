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
    { key: 'requestNumber', header: 'Request No.', sortable: true, width: '15%' },
    {
      key: 'applicantFullName',
      header: 'Applicant',
      render: (_value: unknown, row: ApproverRequestListItem) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.applicant.fullName}</p>
          <p className="text-xs text-slate-500">{row.applicant.branch}</p>
        </div>
      ),
      width: '22%',
    },
    { key: 'applicationDate', header: 'Applied Date', sortable: true, width: '12%', render: (value: unknown) => formatDate(value as string) },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, width: '15%', render: (_value: unknown, row: ApproverRequestListItem) => formatCurrency(row.totalAmount, row.currencyCode) },
    { key: 'statusId', header: 'Status', sortable: true, width: '16%', render: (value: unknown) => <ApproverStatusBadge statusId={value as number} size="sm" /> },
    { key: 'createdDate', header: 'Created Date', sortable: true, width: '20%', render: (value: unknown) => formatDate(value as string) },
  ];

  const rows = data.map((item) => ({
    ...item,
    applicantFullName: item.applicant.fullName,
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
