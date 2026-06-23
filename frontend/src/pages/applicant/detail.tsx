import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { fetchPaymentRequestDetail, submitToManager, submitToApprover, updatePaymentRequest } from './services/api';
import ReceiptUpload from './components/ReceiptUpload';

interface Breakdown { description: string; amount: number | string; }
interface Log { id: string; comment: string; new_status_id: number; timestamp: string; }
interface Receipt { id: string; file_name: string; file_size: number; }
interface DetailData {
  id: string;
  request_number: string;
  status_id: number;
  created_at: string;
  currency_id: number;
  application_date: string;
  desired_payment_date: string;
  payment_method_id: number;
  total_amount: string;
  has_receipt: boolean;
  breakdowns?: Breakdown[];
  logs?: Log[];
  receipts?: Receipt[];
}

const StatusBadge: React.FC<{ statusId: number }> = ({ statusId }) => {
  const getStatusConfig = () => {
    switch (statusId) {
      case 1:
        return { label: 'Draft', classes: 'bg-slate-100 text-slate-700 border-slate-200', icon: <FileText className="w-3 h-3" /> };
      case 2:
      case 3:
        return { label: 'Submitted', classes: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> };
      case 4:
        return { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> };
      case 5:
      case 6:
        return { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> };
      default:
        return { label: 'Unknown', classes: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
    }
  };

  const config = getStatusConfig();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.classes}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const PaymentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<DetailData> | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchPaymentRequestDetail(id!) as DetailData;
      setData(result);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [id, loadData]);



  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await submitToManager(id!);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproverSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await submitToApprover(id!);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to submit to Approver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditToggle = () => {
    if (!data) return;
    if (!isEditing) {
      setEditData({
        currency_id: data.currency_id,
        application_date: data.application_date.split('T')[0],
        desired_payment_date: data.desired_payment_date.split('T')[0],
        payment_method_id: data.payment_method_id,
        breakdowns: data.breakdowns ? data.breakdowns.map((b) => ({ ...b })) : [],
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    try {
      setSubmitting(true);
      setError(null);
      await updatePaymentRequest(id!, editData);
      setIsEditing(false);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-slate-600 font-medium">Request not found or access denied.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const formatCurrency = (amount: string, currencyId: number) => {
    const symbol = currencyId === 1 ? '$' : currencyId === 2 ? '€' : '¥';
    return `${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const rejectionLog = data.logs?.find((log) => log.new_status_id === 5 || log.new_status_id === 9);
  const isEditableStatus = [1, 5, 9].includes(data.status_id);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/applicant')}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{data.request_number}</h1>
                <StatusBadge statusId={data.status_id} />
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Created on {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleEditToggle}
                disabled={submitting}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all disabled:opacity-70"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {isEditableStatus && (
                <button 
                  onClick={handleEditToggle}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all"
                >
                  Edit Request
                </button>
              )}
              {data.status_id === 1 && (
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit to Manager'}
                </button>
              )}
              {data.status_id === 4 && (
                <button 
                  onClick={handleApproverSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit to Final Approver'}
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isEditing && rejectionLog && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Request Rejected</h3>
              <p className="text-sm">{rejectionLog.comment || 'No comment provided.'}</p>
              <p className="text-xs text-orange-600 mt-2">Please edit your request to address the feedback and resubmit.</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Breakdowns */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-base font-semibold text-slate-800">Breakdown Items</h2>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                  {data.breakdowns?.length || 0} items
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {(isEditing && editData ? editData.breakdowns : data.breakdowns)?.map((item, i: number) => (
                  <div key={i} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {i + 1}
                      </div>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const newB = [...editData!.breakdowns!];
                            newB[i].description = e.target.value;
                            setEditData({...editData, breakdowns: newB});
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500 text-slate-900 bg-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{item.description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            const newB = [...editData!.breakdowns!];
                            newB[i].amount = parseFloat(e.target.value) || 0;
                            setEditData({...editData, breakdowns: newB});
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500 text-slate-900 bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(String(item.amount), data.currency_id)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setEditData({...editData, breakdowns: [...editData!.breakdowns!, { description: '', amount: 0 }]})}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
              )}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-500 text-sm uppercase tracking-wider">Total Amount</span>
                <span className="text-xl font-bold text-slate-900">
                  {isEditing && editData && editData.breakdowns ? 
                    `$${editData.breakdowns.reduce((sum: number, b) => sum + Number(b.amount), 0).toFixed(2)}` : 
                    formatCurrency(data.total_amount, data.currency_id)
                  }
                </span>
              </div>
            </div>
            
            {/* Activity Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-semibold text-slate-800">Activity Log</h2>
              </div>
              <div className="p-5 space-y-6">
                {data.logs?.map((log, i: number) => (
                  <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                    {i !== (data.logs?.length ?? 0) - 1 && (
                      <div className="absolute left-2.5 top-5 bottom-0 w-px bg-slate-200"></div>
                    )}
                    <div className="absolute left-1.5 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{log.comment}</p>
                        <p className="text-xs text-slate-500 mt-1">Status changed to <span className="font-medium">{log.new_status_id === 1 ? 'Draft' : log.new_status_id === 2 ? 'Submitted' : 'Other'}</span></p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="md:col-span-1 space-y-6">
            
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Details</h3>
              
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Application Date</p>
                {isEditing && editData ? (
                  <input type="date" value={editData.application_date ?? ''} onChange={e => setEditData({...editData, application_date: e.target.value})} className="w-full px-2 py-1 border rounded text-slate-900 bg-white" />
                ) : (
                  <p className="text-sm text-slate-900 font-medium">{new Date(data.application_date).toLocaleDateString()}</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Desired Payment Date</p>
                {isEditing && editData ? (
                  <input type="date" value={editData.desired_payment_date ?? ''} onChange={e => setEditData({...editData, desired_payment_date: e.target.value})} className="w-full px-2 py-1 border rounded text-slate-900 bg-white" />
                ) : (
                  <p className="text-sm text-slate-900 font-medium">{new Date(data.desired_payment_date).toLocaleDateString()}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Payment Method</p>
                {isEditing && editData ? (
                  <select value={editData.payment_method_id ?? ''} onChange={e => setEditData({...editData, payment_method_id: Number(e.target.value)})} className="w-full px-2 py-1 border rounded text-slate-900 bg-white">
                    <option value={1}>Bank Transfer</option>
                    <option value={2}>Credit Card</option>
                    <option value={3}>Cash</option>
                  </select>
                ) : (
                  <p className="text-sm text-slate-900 font-medium">
                    {data.payment_method_id === 1 ? 'Bank Transfer' : 'Other'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Receipts Attached</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${data.has_receipt ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  {data.has_receipt ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Receipts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Receipts</h3>
              {data.receipts && data.receipts.length > 0 ? (
                <div className="space-y-2">
                  {data.receipts.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate" title={r.file_name}>{r.file_name}</span>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{(r.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No receipts attached.</p>
              )}

              {(data.status_id === 1 || data.status_id === 4) && (
                <div className="pt-2 mt-4 border-t border-slate-100">
                  <ReceiptUpload paymentRequestId={data.id} onUploadSuccess={loadData} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestDetail;
