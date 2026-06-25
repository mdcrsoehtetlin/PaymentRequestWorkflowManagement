import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Send } from 'lucide-react';
import apiClient from '../../services/api-client';
import { uploadReceipt } from './services/api';
import { BreakdownItemTable } from './components/BreakdownItemTable';
import ReceiptUpload from './components/ReceiptUpload';
import { calculateTotal, type BreakdownItem } from './utils/calculate-total';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  PaymentMethod,
  Currency,
  PaymentType,
  PAYMENT_METHOD_LABELS_EN,
  PAYMENT_TYPE_LABELS_EN,
  CURRENCY_CODES,
  BANK_INFO_REQUIRED_METHODS,
} from '../../types';

import { useToast } from '../../hooks/useToast';

const PaymentRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const { success, error, warning } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    currency_id: Currency.MMK as number,
    application_date: today,
    desired_payment_date: today,
    payment_type_id: PaymentType.ADVANCE_PAYMENT as number,
    payment_method_id: PaymentMethod.BANK_TRANSFER as number,
    target_manager_id: 1,
    has_receipt: false,
    purpose: '',
    request_content: '',
    bank_account_info: '',
  });

  const [breakdowns, setBreakdowns] = useState<BreakdownItem[]>([
    { description: '', amount: '' },
  ]);

  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [managers, setManagers] = useState<{ userId: number; fullName: string; department: string }[]>([]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await apiClient.get('/applicant/payment-requests/managers', {
          withCredentials: true,
        });
        const fetchedManagers = response.data.data || [];
        setManagers(fetchedManagers);
        
        // Auto-select the first manager if available and none selected
        if (fetchedManagers.length > 0 && formData.target_manager_id === 1) {
          setFormData(prev => ({ ...prev, target_manager_id: fetchedManagers[0].userId }));
        }
      } catch (error) {
        console.error('Failed to fetch managers:', error);
        warning('Could not load active managers list');
      }
    };
    fetchManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Validates the form for draft save (relaxed) */
  const validateDraft = (): string[] => {
    const errors: string[] = [];
    // At least one breakdown item with description or amount
    const validBreakdowns = breakdowns.filter(
      (b) => b.description.trim() !== '' || (parseFloat(b.amount) > 0),
    );
    if (validBreakdowns.length === 0) {
      errors.push('At least one breakdown item is required.');
    }
    // Application date cannot be in the future
    if (formData.application_date > today) {
      errors.push('Application date cannot be a future date.');
    }
    // Desired payment date must be today or later
    if (formData.desired_payment_date < today) {
      errors.push('Desired payment date must be today or later.');
    }
    return errors;
  };

  /** Validates the form for submission (strict) */
  const validateSubmit = (): string[] => {
    const errors = validateDraft();
    if (!formData.purpose.trim()) {
      errors.push('Purpose / Usage is required.');
    }
    if (formData.purpose.length > 255) {
      errors.push('Purpose must not exceed 255 characters.');
    }
    if (!formData.request_content.trim()) {
      errors.push('Payment Request Content is required.');
    }
    if (formData.request_content.length > 1000) {
      errors.push('Payment Request Content must not exceed 1000 characters.');
    }
    if (!formData.target_manager_id) {
      errors.push('Target Manager must be selected.');
    }
    if (!formData.currency_id) {
      errors.push('Currency must be selected.');
    }
    if (!formData.payment_type_id) {
      errors.push('Payment Type must be selected.');
    }
    if (!formData.payment_method_id) {
      errors.push('Payment Method must be selected.');
    }
    // Bank account required for Bank Transfer or Cash
    if (
      BANK_INFO_REQUIRED_METHODS.includes(formData.payment_method_id) &&
      !formData.bank_account_info.trim()
    ) {
      errors.push('Bank Account / Phone information is required for this payment method.');
    }
    // Receipt validation
    if (formData.has_receipt && !createdDraftId) {
      errors.push('Please save as draft and upload receipt files before submitting.');
    }
    // Breakdown amounts > 0
    const validBreakdowns = breakdowns.filter(
      (b) => b.description.trim() !== '' || (parseFloat(b.amount) > 0),
    );
    for (const b of validBreakdowns) {
      const amt = parseFloat(b.amount);
      if (isNaN(amt) || amt <= 0) {
        errors.push('All breakdown item amounts must be greater than 0.');
        break;
      }
      if (amt > 1000000000) {
        errors.push('Breakdown item amounts must not exceed 1,000,000,000.');
        break;
      }
    }
    return errors;
  };

  const handleSaveDraft = async (): Promise<void> => {
    const errors = validateDraft();
    if (errors.length > 0) {
      setValidationErrors(errors);
      error(errors[0]);
      return;
    }
    setValidationErrors([]);

    try {
      setLoading(true);
      const payload = {
        ...formData,
        breakdowns: breakdowns
          .filter((b) => b.description.trim() !== '' || parseFloat(b.amount) > 0)
          .map((b) => ({
            description: b.description.trim(),
            amount: b.amount || '0',
          })),
      };
      
      if (createdDraftId) {
        await apiClient.put(`/applicant/payment-requests/${createdDraftId}`, payload, {
          withCredentials: true,
        });
        if (formData.has_receipt && receiptFile) {
           await uploadReceipt(createdDraftId, receiptFile);
        }
        success('Draft updated successfully.');
      } else {
        const response = await apiClient.post('/applicant/payment-requests/draft', payload, {
          withCredentials: true,
        });
        const newDraftId = response.data.data.id.toString();
        setCreatedDraftId(newDraftId);
        
        if (formData.has_receipt && receiptFile) {
           await uploadReceipt(newDraftId, receiptFile);
        }

        success('Draft saved successfully.');
      }
    } catch (err: unknown) {
      console.error('Failed to save draft', err);
      const apiError = err as { response?: { data?: { message?: string } } };
      error(apiError.response?.data?.message || 'Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManager = async (): Promise<void> => {
    if (!createdDraftId) {
      warning('Please save as draft first before submitting.');
      return;
    }

    const errors = validateSubmit();
    if (errors.length > 0) {
      setValidationErrors(errors);
      error(errors[0]);
      return;
    }
    setValidationErrors([]);

    try {
      setLoading(true);
      await apiClient.post(`/applicant/payment-requests/${createdDraftId}/submit-to-manager`, {}, {
        withCredentials: true,
      });
      success('Request submitted to Manager successfully.');
      navigate('/applicant');
    } catch (err: unknown) {
      console.error('Failed to submit to manager', err);
      const apiError = err as { response?: { data?: { message?: string } } };
      error(apiError.response?.data?.message || 'Failed to submit. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal(breakdowns);

  // Read employee info from auth context
  const employeeInfo = {
    number: user?.employeeNumber || '-',
    name: user?.fullName || '-',
    branch: user?.branch || '-',
    department: user?.department || '-',
  };

  const showBankAccountField = BANK_INFO_REQUIRED_METHODS.includes(
    formData.payment_method_id,
  );

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Payment Request</h1>
            <p className="text-slate-500 text-sm">Create a draft to submit for approval</p>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-semibold mb-1">Please fix the following errors:</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Request Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Purpose / Usage <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Q3 Marketing Campaign Expenses"
                      maxLength={255}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      aria-required="true"
                    />
                    <p className="text-xs text-slate-400 mt-1">{formData.purpose.length}/255 characters</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payment Request Content <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Detailed explanation of the request..."
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 resize-none"
                      value={formData.request_content}
                      onChange={(e) => setFormData({...formData, request_content: e.target.value})}
                      aria-required="true"
                    />
                    <p className="text-xs text-slate-400 mt-1">{formData.request_content.length}/1000 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Manager <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.target_manager_id}
                      onChange={(e) => setFormData({...formData, target_manager_id: Number(e.target.value)})}
                      aria-required="true"
                    >
                      {managers.length === 0 && <option value={0}>Loading managers...</option>}
                      {managers.map(m => (
                        <option key={m.userId} value={m.userId}>
                          {m.fullName} {m.department ? `(${m.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payment Type <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.payment_type_id}
                      onChange={(e) => setFormData({...formData, payment_type_id: Number(e.target.value)})}
                      aria-required="true"
                    >
                      {Object.entries(PAYMENT_TYPE_LABELS_EN).map(([id, label]) => (
                        <option key={id} value={Number(id)}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.payment_method_id}
                      onChange={(e) => setFormData({...formData, payment_method_id: Number(e.target.value)})}
                      aria-required="true"
                    >
                      {Object.entries(PAYMENT_METHOD_LABELS_EN).map(([id, label]) => (
                        <option key={id} value={Number(id)}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({...formData, currency_id: Number(e.target.value)})}
                      aria-required="true"
                    >
                      {Object.entries(CURRENCY_CODES).map(([id, code]) => (
                        <option key={id} value={Number(id)}>{code}</option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional Bank Account / Phone field */}
                  {showBankAccountField && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bank Account / Phone <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Enter bank account number or phone number"
                        maxLength={200}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                        value={formData.bank_account_info}
                        onChange={(e) => setFormData({...formData, bank_account_info: e.target.value})}
                        aria-required="true"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Application Date</label>
                    <input 
                      type="date" 
                      max={today}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.application_date}
                      onChange={(e) => setFormData({...formData, application_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Desired Payment Date</label>
                    <input 
                      type="date" 
                      min={today}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white"
                      value={formData.desired_payment_date}
                      onChange={(e) => setFormData({...formData, desired_payment_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2 pt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Receipt Present? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="has_receipt" 
                          checked={formData.has_receipt === true}
                          onChange={() => setFormData({...formData, has_receipt: true})}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="has_receipt" 
                          checked={formData.has_receipt === false}
                          onChange={() => setFormData({...formData, has_receipt: false})}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-4">
                <BreakdownItemTable items={breakdowns} onChange={setBreakdowns} />
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">Total Amount</p>
                    <p className="text-3xl font-bold text-slate-900">{totalAmount}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {formData.has_receipt && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Receipts</h2>
                  {createdDraftId ? (
                    <ReceiptUpload paymentRequestId={createdDraftId} onUploadSuccess={() => {}} />
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                      <p className="text-slate-600 mb-4 text-sm">Select a receipt file to attach. It will be uploaded when you save the draft.</p>
                      <input 
                         type="file" 
                         className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100 cursor-pointer"
                         onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setReceiptFile(e.target.files[0]);
                            }
                         }}
                      />
                      {receiptFile && <p className="text-sm text-indigo-600 mt-3 text-left">Selected: {receiptFile.name}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Sidebar / Employee Info & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Employee Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Employee Number</p>
                  <p className="text-sm font-semibold text-slate-900">{employeeInfo.number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Name</p>
                  <p className="text-sm font-semibold text-slate-900">{employeeInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Branch</p>
                  <p className="text-sm font-semibold text-slate-900">{employeeInfo.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Department</p>
                  <p className="text-sm font-semibold text-slate-900">{employeeInfo.department}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Actions</h3>
              
              <button 
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button 
                onClick={handleSubmitManager}
                disabled={!createdDraftId || loading}
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 font-medium rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                  createdDraftId 
                    ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-sm' 
                    : 'bg-blue-50 text-blue-400 cursor-not-allowed'
                }`}
                title={createdDraftId ? "Submit to Manager" : "Save as draft first before submitting"}
              >
                <Send className="w-4 h-4" />
                Submit to Manager
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestForm;
