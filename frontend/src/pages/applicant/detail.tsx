import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, FileText, AlertCircle, Trash2, Download } from 'lucide-react';
import { fetchPaymentRequestDetail, submitToManager, submitToApprover, updatePaymentRequest, deleteReceipt, downloadReceipt } from './services/api';
import apiClient from '../../services/api-client';
import ReceiptUpload from './components/ReceiptUpload';
import { EDITABLE_STATUSES, CURRENCY_CODES } from '../../types';

interface Breakdown { description: string; amount: number | string; }
interface Log { id: string; comment: string; new_status_id: number; action_type_id: number; timestamp: string; }
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
  payment_type_id: number;
  purpose: string;
  request_content: string;
  target_manager_id: number | null;
  bank_account_info: string | null;
  total_amount: string;
  has_receipt: boolean;
  breakdowns?: Breakdown[];
  logs?: Log[];
  receipts?: Receipt[];
}

import { StatusBadge, ConfirmDialog } from '../../components/shared';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/format';

const PaymentRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<DetailData> | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const { success: showSuccess, error: showError } = useToast();
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const [managers, setManagers] = useState<{ userId: number; fullName: string; department: string }[]>([]);

  const getStatusLabel = (statusId: number) => {
    const statusMap: Record<number, string> = {
      1: 'draft',
      2: 'submitted_manager',
      3: 'manager_reviewing',
      4: 'manager_verified',
      5: 'rejected_manager',
      6: 'submitted_approver',
      7: 'approver_reviewing',
      8: 'approved',
      9: 'rejected_approver',
      10: 'paid',
    };
    const key = statusMap[statusId];
    return key ? t(`common.statuses.${key}`) : `Status ${statusId}`;
  };

  useEffect(() => {
    // Fetch managers for the dropdown
    const fetchManagers = async () => {
      try {
        const { data } = await apiClient.get('/applicant/payment-requests/managers');
        setManagers(data.data || []);
      } catch (err) {
        console.error('Failed to load managers', err);
      }
    };
    fetchManagers();
  }, []);

  const loadData = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const result = await fetchPaymentRequestDetail(id!) as DetailData;
      setData(result);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || t('applicant.detail.errors.failed_load_details'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id, t]);

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
      showSuccess(t('applicant.detail.success.submitted'));
      await loadData(false);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || t('applicant.detail.errors.failed_submit'));
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
      setError(apiError.response?.data?.message || t('applicant.detail.errors.failed_submit_approver'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && data) {
      setEditData({
        currency_id: data.currency_id,
        application_date: data.application_date ? data.application_date.split('T')[0] : '',
        desired_payment_date: data.desired_payment_date ? data.desired_payment_date.split('T')[0] : '',
        payment_method_id: data.payment_method_id,
        payment_type_id: data.payment_type_id,
        purpose: data.purpose,
        request_content: data.request_content,
        target_manager_id: data.target_manager_id,
        bank_account_info: data.bank_account_info,
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
      
      const payload = {
        ...editData,
        breakdowns: editData.breakdowns
          ?.filter((b) => b.description.trim() !== '' || parseFloat(String(b.amount)) > 0)
          .map((b) => ({
            description: b.description.trim(),
            amount: typeof b.amount === 'string' ? parseFloat(b.amount || '0') : (b.amount || 0),
          })) || [],
      };

      await updatePaymentRequest(id!, payload);
      setIsEditing(false);
      showSuccess(t('applicant.detail.success.saved'));
      await loadData(false);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || t('applicant.detail.errors.failed_update'));
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
        <p className="text-slate-600 font-medium">{t('applicant.detail.errors.not_found')}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">{t('applicant.detail.go_back')}</button>
      </div>
    );
  }



  const reversedLogs = data.logs ? [...data.logs].reverse() : [];
  const rejectionLog = reversedLogs.find((log) => log.action_type_id === 6 || log.action_type_id === 9);
  const editLogAfterRejection = rejectionLog ? reversedLogs.find((log) => log.action_type_id === 2 && new Date(log.timestamp) > new Date(rejectionLog.timestamp)) : null;
  const hasBeenEditedSinceRejection = !!editLogAfterRejection;
  const isRejectedStatus = data.status_id === 5 || data.status_id === 9;

  const isEditableStatus = [1, 5, 9].includes(data.status_id);

  return (
    <div className="min-h-screen font-sans relative">
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
                {t('applicant.detail.created_on')} {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleEditToggle}
                disabled={submitting}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
              >
                {t('applicant.detail.buttons.cancel')}
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
              >
                {submitting ? t('applicant.detail.buttons.saving') : t('applicant.detail.buttons.save_changes')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {isEditableStatus && (
                <button 
                  onClick={handleEditToggle}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  {t('applicant.detail.buttons.edit_request')}
                </button>
              )}
              {[1, 5, 9].includes(data.status_id) && 
                (data.status_id === 1 || hasBeenEditedSinceRejection) && (
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? t('applicant.detail.buttons.submitting') : t('applicant.detail.buttons.submit_to_manager')}
                </button>
              )}
              {data.status_id === 4 && (
                <button 
                  onClick={handleApproverSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? t('applicant.detail.buttons.submitting') : t('applicant.detail.buttons.submit_to_approver')}
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

        {!isEditing && isRejectedStatus && rejectionLog && !hasBeenEditedSinceRejection && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1">{t('applicant.detail.rejection_banner.title')}</h3>
              <p className="text-sm">{rejectionLog.comment || t('applicant.detail.rejection_banner.no_comment')}</p>
              <p className="text-xs text-orange-600 mt-2">{t('applicant.detail.rejection_banner.guidance')}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Request Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-5 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">{t('applicant.detail.title')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('applicant.detail.fields.purpose')}</label>
                {isEditing && editData ? (
                  <input type="text" maxLength={255} value={editData.purpose ?? ''} onChange={e => setEditData({...editData, purpose: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                ) : (
                  <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{data.purpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('applicant.detail.fields.payment_content')}</label>
                {isEditing && editData ? (
                  <textarea maxLength={1000} rows={4} value={editData.request_content ?? ''} onChange={e => setEditData({...editData, request_content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                ) : (
                  <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{data.request_content}</p>
                )}
              </div>
            </div>

            {/* Breakdowns */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-base font-semibold text-slate-800">{t('applicant.detail.breakdown.title')}</h2>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                  {data.breakdowns?.length || 0} {t('common.items')}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {(isEditing && editData ? editData.breakdowns : data.breakdowns)?.map((item, i: number) => (
                  <div key={i} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {i + 1}
                      </div>
                      {isEditing && editData ? (
                        <input 
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            if (!editData?.breakdowns) return;
                            const newB = [...editData.breakdowns];
                            newB[i].description = e.target.value;
                            setEditData({...editData, breakdowns: newB});
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500 text-slate-900 bg-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-700 truncate min-w-0">{item.description || <span className="italic text-slate-400">{t('applicant.detail.breakdown.no_description')}</span>}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {isEditing && editData ? (
                        <input 
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            if (!editData?.breakdowns) return;
                            const newB = [...editData.breakdowns];
                            newB[i].amount = parseFloat(e.target.value) || 0;
                            setEditData({...editData, breakdowns: newB});
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500 text-slate-900 bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(String(item.amount), CURRENCY_CODES[data.currency_id as keyof typeof CURRENCY_CODES] || 'MMK')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => editData && setEditData({...editData, breakdowns: [...(editData.breakdowns ?? []), { description: '', amount: 0 }]})}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    {t('applicant.detail.breakdown.add_item')}
                  </button>
                </div>
              )}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-500 text-sm uppercase tracking-wider">{t('applicant.detail.breakdown.total_amount')}</span>
                <span className="text-xl font-bold text-slate-900 whitespace-nowrap">
                  {isEditing && editData && editData.breakdowns ? 
                    formatCurrency(
                      String(editData.breakdowns.reduce((sum: number, b) => sum + Number(b.amount), 0)),
                      CURRENCY_CODES[editData.currency_id as keyof typeof CURRENCY_CODES] || 'MMK'
                    ) : 
                    formatCurrency(data.total_amount, CURRENCY_CODES[data.currency_id as keyof typeof CURRENCY_CODES] || 'MMK')
                  }
                </span>
              </div>
            </div>
            
            {/* Activity Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-semibold text-slate-800">{t('applicant.detail.activity_log')}</h2>
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
                        <p className="text-xs text-slate-500 mt-1">
                          {t('applicant.detail.status_changed_to')}{' '}
                          <span className="font-medium">
                            {getStatusLabel(log.new_status_id)}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {rejectionLog && data.status_id === 5 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">{t('applicant.detail.reply_to_rejection.title')}</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={t('applicant.detail.reply_to_rejection.placeholder')} 
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={replyComment}
                      onChange={(e) => setReplyComment(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && replyComment.trim()) {
                           await apiClient.post(`/applicant/payment-requests/${data.id}/comments`, { comment: replyComment });
                           setReplyComment('');
                           loadData();
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        if (replyComment.trim()) {
                           await apiClient.post(`/applicant/payment-requests/${data.id}/comments`, { comment: replyComment });
                           setReplyComment('');
                           loadData();
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {t('applicant.detail.buttons.comment')}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="md:col-span-1 space-y-6">
            
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">{t('applicant.detail.details_section')}</h3>
              
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.application_date')}</p>
                {isEditing && editData ? (
                  <input type="date" value={editData.application_date ?? ''} onChange={e => setEditData({...editData, application_date: e.target.value})} className="w-full px-2 py-1 border rounded text-slate-900 bg-white" />
                ) : (
                  <p className="text-sm text-slate-900 font-medium">{new Date(data.application_date).toLocaleDateString()}</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.desired_payment_date')}</p>
                {isEditing && editData ? (
                  <input type="date" value={editData.desired_payment_date ?? ''} onChange={e => setEditData({...editData, desired_payment_date: e.target.value})} className="w-full px-2 py-1 border rounded text-slate-900 bg-white" />
                ) : (
                  <p className="text-sm text-slate-900 font-medium">{new Date(data.desired_payment_date).toLocaleDateString()}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.target_manager')}</p>
                {isEditing && editData ? (
                  <select value={editData.target_manager_id ?? ''} onChange={e => setEditData({...editData, target_manager_id: Number(e.target.value)})} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
                    <option value="">{t('applicant.detail.fields.select_manager')}</option>
                    {managers.map(m => (
                      <option key={m.userId} value={m.userId}>{m.fullName} ({m.department})</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-900 font-medium">
                    {managers.find(m => m.userId === data.target_manager_id)?.fullName || `${t('applicant.detail.user_id_prefix')}${data.target_manager_id}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.payment_type')}</p>
                  {isEditing && editData ? (
                    <select value={editData.payment_type_id ?? ''} onChange={e => setEditData({...editData, payment_type_id: Number(e.target.value)})} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
                      <option value={1}>{t('common.payment_type.advance_payment')}</option>
                      <option value={2}>{t('common.payment_type.reimbursement')}</option>
                      <option value={3}>{t('common.payment_type.direct_vendor_payment')}</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-900 font-medium">
                      {data.payment_type_id === 1 ? t('common.payment_type.advance_payment') : data.payment_type_id === 2 ? t('common.payment_type.reimbursement') : t('common.payment_type.direct_vendor_payment')}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.currency')}</p>
                  {isEditing && editData ? (
                    <select value={editData.currency_id ?? ''} onChange={e => setEditData({...editData, currency_id: Number(e.target.value)})} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
                      <option value={1}>{t('common.currency.MMK')}</option>
                      <option value={2}>{t('common.currency.USD')}</option>
                      <option value={3}>{t('common.currency.JPY')}</option>
                      <option value={4}>{t('common.currency.THB')}</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-900 font-medium">
                      {data.currency_id === 1 ? t('common.currency.MMK') : data.currency_id === 2 ? t('common.currency.USD') : data.currency_id === 3 ? t('common.currency.JPY') : t('common.currency.THB')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.payment_method')}</p>
                {isEditing && editData ? (
                  <select value={editData.payment_method_id ?? ''} onChange={e => setEditData({...editData, payment_method_id: Number(e.target.value)})} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
                    <option value={1}>{t('common.payment_method.bank_transfer')}</option>
                    <option value={2}>{t('common.payment_method.cash')}</option>
                    <option value={3}>{t('common.payment_method.check')}</option>
                  </select>
                ) : (
                  <p className="text-sm text-slate-900 font-medium">
                    {data.payment_method_id === 1 ? t('common.payment_method.bank_transfer') : data.payment_method_id === 2 ? t('common.payment_method.cash') : t('common.payment_method.check')}
                  </p>
                )}
              </div>

              {((isEditing && editData?.payment_method_id !== 3) || (!isEditing && data.payment_method_id !== 3)) && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.bank_account_phone')}</p>
                  {isEditing && editData ? (
                    <input type="text" maxLength={100} value={editData.bank_account_info ?? ''} onChange={e => setEditData({...editData, bank_account_info: e.target.value})} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                  ) : (
                    <p className="text-sm text-slate-900 font-medium">{data.bank_account_info}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('applicant.detail.fields.receipts_attached')}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${data.has_receipt ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  {data.has_receipt ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>

            {/* Receipts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">{t('applicant.detail.receipts.title')}</h3>
              {data.receipts && data.receipts.length > 0 ? (
                <div className="space-y-2">
                  {data.receipts.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate" title={r.file_name}>{r.file_name}</p>
                          <p className="text-xs text-slate-500">{(r.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await downloadReceipt(data.id, r.id, r.file_name);
                            } catch {
                                showError(t('applicant.detail.receipts.failed_download'));
                            }
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title={t('applicant.detail.receipts.download')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isEditing && EDITABLE_STATUSES.includes(data.status_id) && (
                          <button
                            onClick={() => setReceiptToDelete(r.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-slate-200"
                            title={t('applicant.detail.receipts.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('applicant.detail.receipts.no_receipts')}</p>
              )}

              {isEditing && EDITABLE_STATUSES.includes(data.status_id) && (
                <div className="pt-2 mt-4 border-t border-slate-100">
                  <ReceiptUpload paymentRequestId={data.id} onUploadSuccess={() => loadData(false)} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={!!receiptToDelete}
        onClose={() => setReceiptToDelete(null)}
        onConfirm={async () => {
          if (receiptToDelete) {
            await deleteReceipt(data.id, receiptToDelete);
            setReceiptToDelete(null);
            loadData(false);
          }
        }}
        title={t('applicant.detail.receipts.confirm_delete.title')}
        message={t('applicant.detail.receipts.confirm_delete.message')}
        confirmLabel={t('applicant.detail.receipts.confirm_delete.confirm')}
        variant="danger"
      />
    </div>
  );
};

export default PaymentRequestDetail;
