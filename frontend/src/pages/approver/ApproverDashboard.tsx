import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import type { ApiErrorResponse } from '../../types';
import type { ApproverRequestListItem } from './types';
import { useApproverRequests } from './hooks/useApproverRequests';
import { useApproverRequestDetail } from './hooks/useApproverRequestDetail';
import { wsService } from '../../services/websocket.service';
import { KpiCard, DashboardKpiGrid, SearchFilterBar } from '../../components/shared';
import type { FilterField } from '../../components/shared/SearchFilterBar';
import { LayoutGrid, Clock, Eye, CalendarClock } from 'lucide-react';
import { ApproverStatusBadge } from './components/ApproverStatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatDate } from '../../utils/format';
import { ApproverRequestDetail } from './ApproverRequestDetail';
import { approverService } from './services/approver.service';
import { RefreshButton } from '../../components/shared/RefreshButton';

const useApproverFilterFields = () => {
  const { t } = useTranslation();
  return useMemo<FilterField[]>(() => [
    { key: 'search', label: t('approver.filters.search'), type: 'text', placeholder: t('approver.filters.search_placeholder') },
    { key: 'branch', label: t('approver.filters.branch'), type: 'select', options: [
      { value: '', label: t('approver.filters.all_branches') },
      { value: 'Yangon', label: t('common.branch.yangon') },
      { value: 'Mandalay', label: t('common.branch.mandalay') },
    ] },
    { key: 'desiredDate', label: t('approver.filters.desired_date'), type: 'date' },
    { key: 'statusId', label: t('approver.filters.status'), type: 'select', options: [
      { value: '', label: t('approver.filters.all_statuses') },
      { value: '6', label: t('approver.status.submitted_approver') },
      { value: '7', label: t('approver.status.approver_reviewing') },
      { value: '8', label: t('approver.status.approved') },
      { value: '9', label: t('approver.status.rejected_approver') },
    ], placeholder: t('approver.filters.all_statuses') },
  ], [t]);
};

export function ApproverDashboard() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const approverFilterFields = useApproverFilterFields();
  const {
    query,
    requests,
    meta,
    isLoading: isListLoading,
    loadRequests,
    setPage,
    setPageSize,
    setSort,
    applyFilters,
  } = useApproverRequests();
  const {
    requestDetail,
    isLoading: isDetailLoading,
    error: detailError,
    loadRequestDetail,
    clearRequestDetail,
  } = useApproverRequestDetail();

  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string | number>>(() => {
    const saved = sessionStorage.getItem('approver_dashboard_filterValues');
    return saved ? JSON.parse(saved) : {};
  });
  const [sidebarFilter, setSidebarFilter] = useState<number | 'desiredDateAlert' | undefined | null>(() => {
    const saved = sessionStorage.getItem('approver_dashboard_sidebarFilter');
    if (saved === 'null') return null;
    if (saved === 'undefined') return undefined;
    if (saved === 'desiredDateAlert') return 'desiredDateAlert';
    if (saved !== null && !isNaN(Number(saved))) return Number(saved);
    return 6;
  });
  const previousFilterRef = useRef<number | 'desiredDateAlert' | undefined | null>(undefined);
  const [summary, setSummary] = useState({ totalQueue: 0, pendingCount: 0, reviewingCount: 0, desiredDateAlertCount: 0 });
  const location = useLocation();

  const refreshQueue = useCallback(() => {
    loadRequests(query);
    approverService.fetchSummary().then(setSummary).catch(() => {});
  }, [loadRequests, query]);

  // Listen for real-time WebSocket status changes (queue refresh)
  useEffect(() => {
    const handleStatusChanged = () => {
      refreshQueue();
    };
    wsService.on('request:status-changed', handleStatusChanged);
    return () => {
      wsService.off('request:status-changed', handleStatusChanged);
    };
  }, [refreshQueue]);

  // Auto-load request detail from URL path (e.g., /approver/request/123)
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const requestIndex = pathParts.indexOf('request');
    if (requestIndex !== -1 && pathParts[requestIndex + 1]) {
      const requestId = Number(pathParts[requestIndex + 1]);
      if (!isNaN(requestId) && requestId > 0) {
        previousFilterRef.current = sidebarFilter;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRequestId(requestId);
        loadRequestDetail(requestId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    sessionStorage.setItem('approver_dashboard_filterValues', JSON.stringify(filterValues));
  }, [filterValues]);

  useEffect(() => {
    sessionStorage.setItem('approver_dashboard_sidebarFilter', String(sidebarFilter));
  }, [sidebarFilter]);

  useEffect(() => {
    const search = typeof filterValues.search === 'string' ? filterValues.search.trim() || undefined : undefined;
    const branch = typeof filterValues.branch === 'string' ? filterValues.branch.trim() || undefined : undefined;
    const desiredDate = typeof filterValues.desiredDate === 'string' ? filterValues.desiredDate || undefined : undefined;
    const filterStatusId = filterValues.statusId ? Number(filterValues.statusId) : undefined;

    const hasSearchFilters = search || branch || desiredDate || filterStatusId;

    if (hasSearchFilters) {
      applyFilters({ statusId: filterStatusId, search, branch, desiredDate, desiredDateAlert: undefined });
    } else if (sidebarFilter === undefined) {
      applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: true });
    } else if (sidebarFilter === 'desiredDateAlert') {
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', desiredDateAlert: true, showAll: false });
    } else if (typeof sidebarFilter === 'number') {
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', statusId: sidebarFilter, showAll: false });
    }
    approverService.fetchSummary().then(setSummary).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleSoftRefresh = () => {
      sessionStorage.removeItem('approver_dashboard_filterValues');
      sessionStorage.removeItem('approver_dashboard_sidebarFilter');
      setFilterValues({});
      setSidebarFilter(6);
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', statusId: 6, showAll: false });
      approverService.fetchSummary().then(setSummary).catch(() => {});
    };
    window.addEventListener('dashboard-refresh', handleSoftRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleSoftRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!detailError) return;
    const timer = setTimeout(() => clearRequestDetail(), 5000);
    return () => clearTimeout(timer);
  }, [detailError, clearRequestDetail]);

  const handleRowClick = useCallback(async (item: { paymentRequestId: number }) => {
    previousFilterRef.current = sidebarFilter;
    setSelectedRequestId(item.paymentRequestId);
    await loadRequestDetail(item.paymentRequestId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sidebarFilter, loadRequestDetail]);

  const columns: Column<ApproverRequestListItem & { applicantFullName: string; applicantBranch: string }>[] = useMemo(() => [
    {
      key: 'requestNumber',
      header: t('approver.table.columns.request_no'),
      render: (_, row) => (
        <span className="text-blue-700 font-medium hover:text-blue-900 hover:underline cursor-pointer">
          {row.requestNumber}
        </span>
      ),
      width: '13%',
    },
    {
      key: 'applicantFullName',
      header: t('approver.table.columns.applicant'),
      render: (_, row) => (
        <span className="text-sm text-slate-700">{row.applicantFullName}</span>
      ),
      width: '16%',
    },
    {
      key: 'applicantBranch',
      header: t('approver.table.columns.branch'),
      render: (_, row) => {
        const branchKey = `common.branch.${row.applicantBranch.toLowerCase()}`;
        const branchLabel = t(branchKey);
        return <span className="text-sm text-slate-700">{branchLabel !== branchKey ? branchLabel : row.applicantBranch}</span>;
      },
      width: '12%',
    },
    { key: 'applicationDate', header: t('approver.table.columns.application_date'), sortable: true, width: '13%', render: (_, row) => formatDate(row.applicationDate) },
    { key: 'desiredPaymentDate', header: t('approver.table.columns.desired_date'), sortable: true, width: '12%', render: (_, row) => formatDate(row.desiredPaymentDate) },
    {
      key: 'totalAmount',
      header: t('approver.table.columns.amount'),
      sortable: true,
      width: '14%',
      render: (_, row) => (
        <span className="font-medium text-slate-900">
          {Number(row.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {row.currencyCode}
        </span>
      ),
    },
    { key: 'statusId', header: t('approver.table.columns.status'), sortable: true, width: '12%', render: (_, row) => <ApproverStatusBadge statusId={row.statusId} size="sm" /> },
    {
      key: 'action',
      header: t('approver.table.columns.action'),
      width: '8%',
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title={t('approver.table.view_details')}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [handleRowClick, t]);

  const tableRows = useMemo(() =>
    requests.map((item) => ({
      ...item,
      applicantFullName: item.applicant.fullName,
      applicantBranch: item.applicant.branch,
    })),
  [requests]);

  const handleRefresh = () => {
    sessionStorage.removeItem('approver_dashboard_filterValues');
    sessionStorage.removeItem('approver_dashboard_sidebarFilter');
    setFilterValues({});
    setSidebarFilter(6);
    clearRequestDetail();
    setSelectedRequestId(null);
    loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', statusId: 6, showAll: false });
    approverService.fetchSummary().then(setSummary).catch(() => {});
  };

  const handleSidebarFilter = (newStatusId?: number) => {
    setSidebarFilter(newStatusId);
    setFilterValues({});
    if (newStatusId === undefined) {
      applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: true });
    } else {
      applyFilters({ statusId: newStatusId, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: false });
    }
  };

  const handleDesiredDateAlertFilter = () => {
    setSidebarFilter('desiredDateAlert');
    setFilterValues({});
    applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: true, showAll: false });
  };

  const handleSearchApply = (values: Record<string, string | number>) => {
    setFilterValues(values);
    setSidebarFilter(null);
    const search = typeof values.search === 'string' ? values.search.trim() || undefined : undefined;
    const branch = typeof values.branch === 'string' ? values.branch.trim() || undefined : undefined;
    const desiredDate = typeof values.desiredDate === 'string' ? values.desiredDate || undefined : undefined;
    const statusId = values.statusId ? Number(values.statusId) : undefined;
    applyFilters({ statusId, search, branch, desiredDate, desiredDateAlert: undefined });
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setSidebarFilter(undefined);
    applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: true });
  };

  const handleBack = () => {
    clearRequestDetail();
    setSelectedRequestId(null);
    const prev = previousFilterRef.current;
    setSidebarFilter(prev);
    if (prev === null) {
      const search = typeof filterValues.search === 'string' ? filterValues.search.trim() || undefined : undefined;
      const branch = typeof filterValues.branch === 'string' ? filterValues.branch.trim() || undefined : undefined;
      const desiredDate = typeof filterValues.desiredDate === 'string' ? filterValues.desiredDate || undefined : undefined;
      const statusId = filterValues.statusId ? Number(filterValues.statusId) : undefined;
      applyFilters({ statusId, search, branch, desiredDate, desiredDateAlert: undefined });
    } else if (prev === undefined) {
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', showAll: true });
    } else if (prev === 'desiredDateAlert') {
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', desiredDateAlert: true, showAll: false });
    } else {
      loadRequests({ page: 1, pageSize: 10, sortBy: 'modifiedDate', sortOrder: 'DESC', statusId: prev, showAll: false });
    }
    approverService.fetchSummary().then(setSummary).catch(() => {});
  };



  const handleApprove = async (payload: { comment?: string; accountingUserId?: number }) => {
    if (!selectedRequestId) return;
    try {
      await approverService.approveRequest(selectedRequestId, payload);
      success(t('approver.success.approve'));
      await handleBack();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      error(axiosError.response?.data?.message || t('approver.errors.approve'));
    }
  };

  const handleReject = async (payload: { comment: string }) => {
    if (!selectedRequestId) return;
    try {
      await approverService.rejectRequest(selectedRequestId, payload);
      success(t('approver.success.reject'));
      await handleBack();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      error(axiosError.response?.data?.message || t('approver.errors.reject'));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {requestDetail ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('approver.dashboard.back_to_dashboard')}
              </button>
            </div>
            <ApproverRequestDetail
              request={requestDetail}
              isLoading={isDetailLoading}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dashboard.approver.title')}</h1>
                <p className="text-slate-500 mt-1">{t('dashboard.approver.welcome_message')}</p>
              </div>
              <RefreshButton onClick={handleRefresh} label={t('dashboard.manager.refresh')} />
            </div>

            {detailError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{detailError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearRequestDetail}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <DashboardKpiGrid>
                <div className={sidebarFilter === undefined ? 'ring-2 ring-blue-400 rounded-xl' : ''}>
                  <KpiCard
                    label={t('approver.dashboard.kpi.total')}
                    count={summary.totalQueue}
                    icon={<LayoutGrid />}
                    colorClasses="bg-blue-50 text-blue-900 border border-blue-200"
                    onClick={() => handleSidebarFilter(undefined)}
                  />
                </div>
                <div className={sidebarFilter === 6 ? 'ring-2 ring-slate-400 rounded-xl' : ''}>
                  <KpiCard
                    label={t('approver.dashboard.kpi.pending')}
                    count={summary.pendingCount}
                    icon={<Clock />}
                    colorClasses="bg-slate-50 text-slate-900 border border-slate-200"
                    onClick={() => handleSidebarFilter(6)}
                  />
                </div>
                <div className={sidebarFilter === 7 ? 'ring-2 ring-amber-400 rounded-xl' : ''}>
                  <KpiCard
                    label={t('approver.dashboard.kpi.under_review')}
                    count={summary.reviewingCount}
                    icon={<Eye />}
                    colorClasses="bg-amber-50 text-amber-900 border border-amber-200"
                    onClick={() => handleSidebarFilter(7)}
                  />
                </div>
                <div className={sidebarFilter === 'desiredDateAlert' ? 'ring-2 ring-red-400 rounded-xl' : ''}>
                  <KpiCard
                    label={t('approver.dashboard.kpi.desired_date_alert')}
                    count={summary.desiredDateAlertCount}
                    icon={<CalendarClock />}
                    colorClasses="bg-red-50 text-red-900 border border-red-200"
                    onClick={handleDesiredDateAlertFilter}
                  />
                </div>
              </DashboardKpiGrid>

              <div className="[&_button>span:first-child]:whitespace-nowrap">
                <SearchFilterBar
                  fields={approverFilterFields}
                  values={filterValues}
                  onApply={handleSearchApply}
                  onClear={handleClearFilters}
                />
              </div>

              <DataTable
                columns={columns}
                data={tableRows}
                isLoading={isListLoading}
                onRowClick={handleRowClick}
                pagination={{
                  page: meta.page,
                  pageSize: meta.pageSize,
                  totalItems: meta.totalItems,
                  totalPages: meta.totalPages,
                  onPageChange: setPage,
                  onPageSizeChange: setPageSize,
                }}
                sorting={{
                  sortBy: query.sortBy ?? 'modifiedDate',
                  sortOrder: query.sortOrder ?? 'DESC',
                  onSortChange: setSort,
                }}
                  emptyMessage={t('approver.table.empty_message')}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
