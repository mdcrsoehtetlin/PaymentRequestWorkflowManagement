import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Send, XCircle, CheckCircle, Plus, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fetchPaymentRequests, deleteDraft } from './services/api';
import type { DashboardResponseDto } from './services/api';
import { useApplicantSocket } from './hooks/useApplicantSocket';

const StatusBadge: React.FC<{ statusId: number }> = ({ statusId }) => {
  const getStatusConfig = () => {
    switch (statusId) {
      case 1:
        return { label: 'Draft', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 2:
      case 3:
        return { label: 'Submitted', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 4:
        return { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' };
      case 5:
      case 6:
        return { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Unknown', classes: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const config = getStatusConfig();
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${config.classes}`}>
      {config.label}
    </span>
  );
};

const formatCurrency = (amount: string, currencyId: number) => {
  // Mock currency mapping
  const symbol = currencyId === 1 ? '$' : currencyId === 2 ? '€' : '¥';
  return `${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 10;
  
  const { lastUpdate, clearLastUpdate } = useApplicantSocket('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchPaymentRequests(page, limit);
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (lastUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMessage(`Request ${lastUpdate.requestNumber} status updated!`);
      loadData();
      
      const timer = setTimeout(() => {
        setToastMessage(null);
        clearLastUpdate();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastUpdate, loadData, clearLastUpdate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await deleteDraft(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete draft', error);
      alert('Failed to delete draft');
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    total_draft: 0,
    total_submitted: 0,
    total_rejected: 0,
    total_approved: 0,
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
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]">
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
              <p className="text-sm font-medium text-slate-500">Drafts</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.total_draft}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Submitted</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.total_submitted}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rejected</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.total_rejected}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.total_approved}</h3>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Requests</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p>Loading requests...</p>
              </div>
            ) : (!data || !data.requests || data.requests.items.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <FileText className="w-12 h-12 opacity-20" />
                <p>No payment requests found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Request No.</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.requests.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.request_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(item.application_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                        {formatCurrency(item.total_amount, item.currency_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge statusId={item.status_id} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                        {item.status_id === 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/applicant/request/${item.id}`); }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && data && data.requests.total > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <span className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-900">{(page - 1) * limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * limit, data.requests.total)}</span> of <span className="font-medium text-slate-900">{data.requests.total}</span> results
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= data.requests.total}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"
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
