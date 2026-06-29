import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Send, XCircle, CheckCircle, Plus } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { usePaymentRequests } from './hooks/use-payment-requests';
import { StatusBadge, SearchFilterBar, DataTable, DashboardKpiGrid, KpiCard, ConfirmDialog } from '../../components/shared';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import type { Column } from '../../components/shared/DataTable';
import type { PaymentRequestResponseDto } from './services/api';

import { formatDate, formatCurrency } from '../../utils/format';
import { CURRENCY_CODES } from '../../types';

const filterFields: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Request number, applicant, purpose' },
  { key: 'branch', label: 'Branch', type: 'select', options: [
    { value: '', label: 'All Branches' },
    { value: 'Yangon', label: 'Yangon' },
    { value: 'Mandalay', label: 'Mandalay' },
    { value: 'Naypyidaw', label: 'Naypyidaw' },
  ] },
  { key: 'desiredDate', label: 'Desired Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: '', label: 'All Statuses' },
    { value: '1', label: 'Draft' },
    { value: '2', label: 'Submitted to Manager' },
    { value: '3', label: 'Manager Reviewing' },
    { value: '4', label: 'Manager Verified' },
    { value: '5', label: 'Rejected by Manager' },
    { value: '6', label: 'Submitted to Approver' },
    { value: '7', label: 'Approver Reviewing' },
    { value: '8', label: 'Approved' },
    { value: '9', label: 'Rejected by Approver' },
    { value: '10', label: 'Paid' },
  ] },
];

const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(() => {
    const saved = sessionStorage.getItem('applicant_dashboard_limit');
    return saved ? parseInt(saved, 10) : 10;
  });

  const { notifications } = useWebSocket();
  const lastUpdate = notifications[0];
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, string | number>>(() => {
    const saved = sessionStorage.getItem('applicant_dashboard_filters');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeKpi, setActiveKpi] = useState<string | undefined | null>(() => {
    const saved = sessionStorage.getItem('applicant_dashboard_activeKpi');
    if (saved === 'null') return null;
    if (saved === 'undefined') return undefined;
    return saved || undefined;
  });

  React.useEffect(() => {
    sessionStorage.setItem('applicant_dashboard_limit', limit.toString());
  }, [limit]);

  React.useEffect(() => {
    sessionStorage.setItem('applicant_dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  React.useEffect(() => {
    sessionStorage.setItem('applicant_dashboard_activeKpi', String(activeKpi));
  }, [activeKpi]);

  const {
    data,
    loading,
    page,
    setPage,
    deleteId,
    setDeleteId,
    handleDelete,
    loadData
  } = usePaymentRequests(limit, lastUpdate, filters);

  React.useEffect(() => {
    const handleSoftRefresh = () => {
      setFilters({});
      setActiveKpi(undefined);
      setPage(1);
      loadData(true);
    };
    window.addEventListener('dashboard-refresh', handleSoftRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleSoftRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const handleKpiClick = (kpi: string | undefined | null) => {
    setActiveKpi(kpi);
    if (kpi === undefined) {
      setFilters({}); // Total requests = no filters
    } else if (kpi) {
      setFilters({ kpi }); // Clear all other filters, keep only KPI
    } else {
      setFilters({});
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveKpi(undefined);
    setPage(1);
  };

  const columns: Column<PaymentRequestResponseDto>[] = React.useMemo(() => [
    {
      key: 'request_number',
      header: 'Request No.',
      render: (_, row) => (
        <span className="text-blue-700 font-medium hover:text-blue-900 hover:underline cursor-pointer">
          {row.request_number}
        </span>
      ),
    },
    {
      key: 'application_date',
      header: 'Application Date',
      render: (_, row) => <span className="text-sm text-slate-700">{formatDate(row.application_date)}</span>,
    },
    {
      key: 'desired_payment_date',
      header: 'Desired Date',
      render: (_, row) => <span className="text-sm text-slate-700">{formatDate(row.desired_payment_date)}</span>,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (_, row) => {
        const currencyCode = CURRENCY_CODES[row.currency_id as keyof typeof CURRENCY_CODES] || 'MMK';
        return (
          <span className="font-medium text-slate-900">
            {formatCurrency(row.total_amount, currencyCode)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <StatusBadge statusId={row.status_id} size="sm" />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (_, row) => (
        <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
          {row.status_id === 1 && (
            <button 
              onClick={() => setDeleteId(row.id)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          )}
          <button 
            onClick={() => navigate(`/applicant/request/${row.id}`)}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Details
          </button>
        </div>
      ),
    },
  ], [navigate, setDeleteId]);



  const kpis = data?.kpis || {
    total_requests: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <div className="min-h-screen font-sans relative">      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applicant Dashboard</h1>
              <p className="text-slate-500 mt-1">Manage and track your payment requests</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/applicant/form')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* KPI Cards */}
        <DashboardKpiGrid>
          <div className={activeKpi === undefined ? 'ring-2 ring-slate-400 rounded-xl' : ''}>
            <KpiCard 
              label="Total Requests" 
              count={kpis.total_requests} 
              icon={<FileEdit />} 
              colorClasses="bg-slate-100 text-slate-600 border border-slate-200" 
              onClick={() => handleKpiClick(undefined)} 
            />
          </div>
          <div className={activeKpi === 'pending_review' ? 'ring-2 ring-blue-400 rounded-xl' : ''}>
            <KpiCard 
              label="Pending Review" 
              count={kpis.pending_review} 
              icon={<Send />} 
              colorClasses="bg-blue-50 text-blue-600 border border-blue-200" 
              onClick={() => handleKpiClick('pending_review')} 
            />
          </div>
          <div className={activeKpi === 'approved' ? 'ring-2 ring-emerald-400 rounded-xl' : ''}>
            <KpiCard 
              label="Approved" 
              count={kpis.approved} 
              icon={<CheckCircle />} 
              colorClasses="bg-emerald-50 text-emerald-600 border border-emerald-200" 
              onClick={() => handleKpiClick('approved')} 
            />
          </div>
          <div className={activeKpi === 'rejected' ? 'ring-2 ring-red-400 rounded-xl' : ''}>
            <KpiCard 
              label="Rejected" 
              count={kpis.rejected} 
              icon={<XCircle />} 
              colorClasses="bg-red-50 text-red-600 border border-red-200" 
              onClick={() => handleKpiClick('rejected')} 
            />
          </div>
        </DashboardKpiGrid>

        {/* Search & Filter Bar */}
        <SearchFilterBar
          fields={filterFields}
          values={filters}
          onApply={(newFilters) => {
            const formattedFilters = { ...newFilters };
            
            // Set KPI to null to remove focus from all KPI cards including "Total Requests"
            setActiveKpi(null);
            delete formattedFilters.kpi;

            if (formattedFilters.status) {
              formattedFilters.status = parseInt(formattedFilters.status as string, 10);
            }
            // Remove empty filters
            Object.keys(formattedFilters).forEach(key => {
              if (formattedFilters[key] === '' || formattedFilters[key] === undefined || formattedFilters[key] === null) {
                delete formattedFilters[key];
              }
            });
            setFilters(formattedFilters);
            setPage(1);
          }}
          onClear={handleClearFilters}
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.requests.items || []}
          isLoading={loading}
          emptyMessage="No payment requests found."
          onRowClick={(row) => navigate(`/applicant/request/${row.id}`)}
          pagination={
            data && data.requests.total > 0
              ? {
                  page,
                  pageSize: limit,
                  totalItems: data.requests.total,
                  totalPages: Math.ceil(data.requests.total / limit),
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newSize) => {
                    setLimit(newSize);
                    setPage(1);
                  },
                }
              : undefined
          }
        />
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ApplicantDashboard;
