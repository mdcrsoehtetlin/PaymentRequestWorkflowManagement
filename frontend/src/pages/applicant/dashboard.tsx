import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Send, XCircle, CheckCircle, Plus } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { StatusUpdatePayload } from '../../hooks/useWebSocket';
import { usePaymentRequests } from './hooks/use-payment-requests';
import { StatusBadge, SearchFilterBar, DataTable } from '../../components/shared';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import type { Column } from '../../components/shared/DataTable';
import type { PaymentRequestResponseDto } from './services/api';

const formatCurrency = (amount: string, currencyId: number) => {
  // Mock currency mapping
  const symbol = currencyId === 1 ? '$' : currencyId === 2 ? '€' : '¥';
  return `${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

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
  const [limit, setLimit] = useState(10);
  
  const { notifications } = useWebSocket();
  const lastUpdate = notifications[0] as StatusUpdatePayload | undefined;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Record<string, string | number>>({});

  const {
    data,
    loading,
    page,
    setPage,
    deleteId,
    setDeleteId,
    handleDelete
  } = usePaymentRequests(limit, lastUpdate, filters);

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const columns: Column<PaymentRequestResponseDto>[] = React.useMemo(() => [
    {
      key: 'request_number',
      header: 'Request No.',
      render: (_, row) => (
        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
          {row.request_number}
        </span>
      ),
    },
    {
      key: 'application_date',
      header: 'App Date',
      render: (_, row) => new Date(row.application_date).toLocaleDateString(),
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (_, row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (_, row) => (
        <span className="font-medium text-slate-700">
          {formatCurrency(row.total_amount, row.currency_id)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <StatusBadge statusId={row.status_id} />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (_, row) => (
        <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
          {row.status_id === 1 && (
            <button 
              onClick={() => setDeleteId(row.id)}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Delete
            </button>
          )}
          <button 
            onClick={() => navigate(`/applicant/request/${row.id}`)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Details
          </button>
        </div>
      ),
    },
  ], [navigate, setDeleteId]);

  useEffect(() => {
    if (lastUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMessage(`Request ${lastUpdate.requestNumber || lastUpdate.paymentRequestId} status updated!`);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  const kpis = data?.kpis || {
    total_requests: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white border-l-4 border-blue-500 shadow-lg rounded-r-lg p-4 max-w-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-slate-800">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 ml-auto">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Applicant Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage and track your payment requests</p>
          </div>
          <button 
            onClick={() => navigate('/applicant/form')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Requests</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.total_requests}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Review</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.pending_review}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.approved}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rejected</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.rejected}</h3>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <SearchFilterBar
          fields={filterFields}
          values={filters}
          onApply={(newFilters) => {
            const formattedFilters = { ...newFilters };
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
          
          <div className="flex-1 p-0 flex flex-col">
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
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Draft</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this draft? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDashboard;
