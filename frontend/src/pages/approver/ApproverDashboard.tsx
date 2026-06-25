import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import type { ApiErrorResponse } from '../../types';
import type { ApproverRequestDetailView } from './types';
import { useApproverRequests } from './hooks/useApproverRequests';
import { useApproverRequestDetail } from './hooks/useApproverRequestDetail';
import { FilterSearchBar } from './components/FilterSearchBar';
import { KpiCard, DashboardKpiGrid } from '../../components/shared';
import { LayoutGrid, Clock, Eye, CalendarClock } from 'lucide-react';
import { ApproverRequestTable } from './components/ApproverRequestTable';
import { ApproverRequestDetail } from './ApproverRequestDetail';
import { approverService } from './services/approver.service';
import { RefreshButton } from '../../components/shared/RefreshButton';

export function ApproverDashboard() {
  const { t } = useTranslation();
  const { success, error } = useToast();
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
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>(undefined);
  const [sidebarFilter, setSidebarFilter] = useState<number | 'desiredDateAlert' | undefined>(undefined);
  const [summary, setSummary] = useState({ totalQueue: 0, pendingCount: 0, reviewingCount: 0, desiredDateAlertCount: 0 });

  useEffect(() => {
    loadRequests({ page: 1, pageSize: 10, sortBy: 'managerVerificationDate', sortOrder: 'DESC', showAll: true });
    approverService.fetchSummary().then(setSummary).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!detailError) return;
    const timer = setTimeout(() => clearRequestDetail(), 5000);
    return () => clearTimeout(timer);
  }, [detailError, clearRequestDetail]);

  const handleRowClick = async (item: ApproverRequestDetailView) => {
    setSelectedRequestId(item.paymentRequestId);
    await loadRequestDetail(item.paymentRequestId);
  };

  const handleRefresh = () => {
    setSearch('');
    setBranch('');
    setDesiredDate('');
    setStatusId(undefined);
    setSidebarFilter(undefined);
    clearRequestDetail();
    setSelectedRequestId(null);
    loadRequests({ page: 1, pageSize: 10, sortBy: 'managerVerificationDate', sortOrder: 'DESC', showAll: true });
    approverService.fetchSummary().then(setSummary).catch(() => {});
  };

  const handleSidebarFilter = (newStatusId?: number) => {
    setSidebarFilter(newStatusId);
    setStatusId(undefined);
    setSearch('');
    setBranch('');
    setDesiredDate('');
    if (newStatusId === undefined) {
      applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: true });
    } else {
      applyFilters({ statusId: newStatusId, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: false });
    }
  };

  const handleDesiredDateAlertFilter = () => {
    setSidebarFilter('desiredDateAlert');
    setStatusId(undefined);
    setSearch('');
    setBranch('');
    setDesiredDate('');
    applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: true, showAll: false });
  };

  const handleSearchApply = () => {
    applyFilters({ statusId, search: search.trim() || undefined, branch: branch.trim() || undefined, desiredDate: desiredDate || undefined, desiredDateAlert: undefined });
  };

  const handleClearFilters = () => {
    setSearch('');
    setBranch('');
    setDesiredDate('');
    setStatusId(undefined);
    setSidebarFilter(undefined);
    applyFilters({ statusId: undefined, search: undefined, branch: undefined, desiredDate: undefined, desiredDateAlert: undefined, showAll: true });
  };

  const handleBack = () => {
    clearRequestDetail();
    setSelectedRequestId(null);
    loadRequests();
    approverService.fetchSummary().then(setSummary).catch(() => {});
  };

  const handleApprove = async (payload: { comment?: string; accountingUserId?: number }) => {
    if (!selectedRequestId) return;
    try {
      await approverService.approveRequest(selectedRequestId, payload);
      success('Request approved successfully.');
      await handleBack();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      error(axiosError.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (payload: { comment: string }) => {
    if (!selectedRequestId) return;
    try {
      await approverService.rejectRequest(selectedRequestId, payload);
      success('Request rejected successfully.');
      await handleBack();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      error(axiosError.response?.data?.message || 'Failed to reject request.');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {requestDetail ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Queue
            </button>
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
                <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.approver.title')}</h1>
                <p className="mt-2 text-sm text-slate-500">{t('dashboard.approver.welcome_message')}</p>
              </div>
              <RefreshButton onClick={handleRefresh} />
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
                    label="Total"
                    count={summary.totalQueue}
                    icon={<LayoutGrid />}
                    colorClasses="bg-blue-50 text-blue-900 border border-blue-200"
                    onClick={() => handleSidebarFilter(undefined)}
                  />
                </div>
                <div className={sidebarFilter === 6 ? 'ring-2 ring-slate-400 rounded-xl' : ''}>
                  <KpiCard
                    label="Pending"
                    count={summary.pendingCount}
                    icon={<Clock />}
                    colorClasses="bg-slate-50 text-slate-900 border border-slate-200"
                    onClick={() => handleSidebarFilter(6)}
                  />
                </div>
                <div className={sidebarFilter === 7 ? 'ring-2 ring-amber-400 rounded-xl' : ''}>
                  <KpiCard
                    label="Under Review"
                    count={summary.reviewingCount}
                    icon={<Eye />}
                    colorClasses="bg-amber-50 text-amber-900 border border-amber-200"
                    onClick={() => handleSidebarFilter(7)}
                  />
                </div>
                <div className={sidebarFilter === 'desiredDateAlert' ? 'ring-2 ring-red-400 rounded-xl' : ''}>
                  <KpiCard
                    label="Desired Date Alert"
                    count={summary.desiredDateAlertCount}
                    icon={<CalendarClock />}
                    colorClasses="bg-red-50 text-red-900 border border-red-200"
                    onClick={handleDesiredDateAlertFilter}
                  />
                </div>
              </DashboardKpiGrid>

              <FilterSearchBar
                search={search}
                branch={branch}
                desiredDate={desiredDate}
                statusId={statusId}
                onSearchChange={setSearch}
                onBranchChange={setBranch}
                onDesiredDateChange={setDesiredDate}
                onStatusChange={setStatusId}
                onSubmit={handleSearchApply}
                onClear={handleClearFilters}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <ApproverRequestTable
                  data={requests}
                  isLoading={isListLoading}
                  page={meta.page}
                  pageSize={meta.pageSize}
                  totalItems={meta.totalItems}
                  totalPages={meta.totalPages}
                  sortBy={query.sortBy ?? 'managerVerificationDate'}
                  sortOrder={query.sortOrder ?? 'DESC'}
                  onRowClick={(item) => handleRowClick(item as ApproverRequestDetailView)}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  onSortChange={setSort}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
