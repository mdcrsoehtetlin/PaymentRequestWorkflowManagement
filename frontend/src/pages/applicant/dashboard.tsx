import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileEdit, Send, XCircle, CheckCircle, Plus, Eye, Trash2 } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { usePaymentRequests } from './hooks/use-payment-requests';
import { StatusBadge, SearchFilterBar, DataTable, DashboardKpiGrid, KpiCard, ConfirmDialog } from '../../components/shared';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import type { Column } from '../../components/shared/DataTable';
import type { PaymentRequestResponseDto } from './services/api';

import { formatDate, formatCurrency } from '../../utils/format';
import { CURRENCY_CODES } from '../../types';

const useApplicantFilterFields = () => {
  const { t } = useTranslation();
  return React.useMemo<FilterField[]>(() => [
    { key: 'search', label: t('common.search'), type: 'text', placeholder: t('approver.filters.search_placeholder') },
    { key: 'branch', label: t('accounting.dashboard.filters.branch'), type: 'select', options: [
      { value: '', label: t('accounting.dashboard.filters.all_branches') },
      { value: 'Yangon', label: t('common.branch.yangon') },
      { value: 'Mandalay', label: t('common.branch.mandalay') },
      { value: 'Naypyidaw', label: t('common.branch.naypyidaw') },
    ] },
    { key: 'desiredDate', label: t('accounting.dashboard.filters.desired_date'), type: 'date' },
    { key: 'status', label: t('accounting.dashboard.filters.status'), type: 'select', options: [
      { value: '', label: t('accounting.dashboard.filters.all_statuses') },
      { value: '1', label: t('common.statuses.draft') },
      { value: '2', label: t('common.statuses.submitted_manager') },
      { value: '3', label: t('common.statuses.manager_reviewing') },
      { value: '4', label: t('common.statuses.manager_verified') },
      { value: '5', label: t('common.statuses.rejected_manager') },
      { value: '6', label: t('common.statuses.submitted_approver') },
      { value: '7', label: t('common.statuses.approver_reviewing') },
      { value: '8', label: t('common.statuses.approved') },
      { value: '9', label: t('common.statuses.rejected_approver') },
      { value: '10', label: t('common.statuses.paid') },
    ] },
  ], [t]);
};

const ApplicantDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const filterFields = useApplicantFilterFields();
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
      header: t('applicant.dashboard.columns.request_no'),
      render: (_, row) => (
        <span className="text-blue-700 font-medium hover:text-blue-900 hover:underline cursor-pointer">
          {row.request_number}
        </span>
      ),
    },
    {
      key: 'application_date',
      header: t('applicant.dashboard.columns.application_date'),
      render: (_, row) => <span className="text-sm text-slate-700">{formatDate(row.application_date)}</span>,
    },
    {
      key: 'desired_payment_date',
      header: t('applicant.dashboard.columns.desired_date'),
      render: (_, row) => <span className="text-sm text-slate-700">{formatDate(row.desired_payment_date)}</span>,
    },
    {
      key: 'total_amount',
      header: t('applicant.dashboard.columns.amount'),
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
      header: t('applicant.dashboard.columns.status'),
      render: (_, row) => <StatusBadge statusId={row.status_id} size="sm" />,
    },
    {
      key: 'action',
      header: t('applicant.dashboard.columns.action'),
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status_id === 1 && (
            <button
              onClick={() => setDeleteId(row.id)}
              title={t('applicant.dashboard.delete_draft.confirm')}
              className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigate(`/applicant/request/${row.id}`)}
            title={t('approver.table.view_details')}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [navigate, setDeleteId, t]);



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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('applicant.dashboard.title')}</h1>
              <p className="text-slate-500 mt-1">{t('applicant.dashboard.description')}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/applicant/form')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            {t('applicant.dashboard.new_request')}
          </button>
        </div>

        {/* KPI Cards */}
        <DashboardKpiGrid>
          <div className={activeKpi === undefined ? 'ring-2 ring-slate-400 rounded-xl' : ''}>
            <KpiCard 
              label={t('applicant.dashboard.kpi.total_requests')} 
              count={kpis.total_requests} 
              icon={<FileEdit />} 
              colorClasses="bg-slate-100 text-slate-600 border border-slate-200" 
              onClick={() => handleKpiClick(undefined)} 
            />
          </div>
          <div className={activeKpi === 'pending_review' ? 'ring-2 ring-blue-400 rounded-xl' : ''}>
            <KpiCard 
              label={t('applicant.dashboard.kpi.pending_review')} 
              count={kpis.pending_review} 
              icon={<Send />} 
              colorClasses="bg-blue-50 text-blue-600 border border-blue-200" 
              onClick={() => handleKpiClick('pending_review')} 
            />
          </div>
          <div className={activeKpi === 'approved' ? 'ring-2 ring-emerald-400 rounded-xl' : ''}>
            <KpiCard 
              label={t('applicant.dashboard.kpi.approved')} 
              count={kpis.approved} 
              icon={<CheckCircle />} 
              colorClasses="bg-emerald-50 text-emerald-600 border border-emerald-200" 
              onClick={() => handleKpiClick('approved')} 
            />
          </div>
          <div className={activeKpi === 'rejected' ? 'ring-2 ring-red-400 rounded-xl' : ''}>
            <KpiCard 
              label={t('applicant.dashboard.kpi.rejected')} 
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
          emptyMessage={t('applicant.dashboard.empty_message')}
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
        title={t('applicant.dashboard.delete_draft.title')}
        message={t('applicant.dashboard.delete_draft.message')}
        confirmLabel={t('applicant.dashboard.delete_draft.confirm')}
        variant="danger"
      />
    </div>
  );
};

export default ApplicantDashboard;
