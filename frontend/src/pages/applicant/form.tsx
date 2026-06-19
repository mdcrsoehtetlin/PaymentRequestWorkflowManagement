import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import apiClient from '../../services/api-client';

const PaymentRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currency_id: 1,
    application_date: new Date().toISOString().split('T')[0],
    desired_payment_date: new Date().toISOString().split('T')[0],
    payment_method_id: 1,
  });
  const [breakdowns, setBreakdowns] = useState([{ description: '', amount: 0 }]);

  const handleAddBreakdown = () => {
    if (breakdowns.length >= 15) return;
    setBreakdowns([...breakdowns, { description: '', amount: 0 }]);
  };

  const handleRemoveBreakdown = (index: number) => {
    if (breakdowns.length <= 1) return;
    setBreakdowns(breakdowns.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        breakdowns: breakdowns.filter(b => b.description.trim() !== '' || b.amount > 0),
      };
      
      await apiClient.post('/applicant/payment-requests/draft', payload, {
        withCredentials: true,
      });
      
      navigate('/applicant');
    } catch (error) {
      console.error('Failed to save draft', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = breakdowns.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Payment Request</h1>
            <p className="text-slate-500 text-sm">Create a draft to submit for approval</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.currency_id}
                  onChange={(e) => setFormData({...formData, currency_id: Number(e.target.value)})}
                >
                  <option value={1}>USD ($)</option>
                  <option value={2}>EUR (€)</option>
                  <option value={3}>JPY (¥)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({...formData, payment_method_id: Number(e.target.value)})}
                >
                  <option value={1}>Bank Transfer</option>
                  <option value={2}>Credit Card</option>
                  <option value={3}>Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.application_date}
                  onChange={(e) => setFormData({...formData, application_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desired Payment Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.desired_payment_date}
                  onChange={(e) => setFormData({...formData, desired_payment_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Breakdown Items</h2>
              <button 
                onClick={handleAddBreakdown}
                disabled={breakdowns.length >= 15}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {breakdowns.map((item, index) => (
                <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <input 
                      type="text" 
                      placeholder="E.g., Office Supplies"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={item.description}
                      onChange={(e) => {
                        const newBreakdowns = [...breakdowns];
                        newBreakdowns[index].description = e.target.value;
                        setBreakdowns(newBreakdowns);
                      }}
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">$</span>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={item.amount || ''}
                        onChange={(e) => {
                          const newBreakdowns = [...breakdowns];
                          newBreakdowns[index].amount = parseFloat(e.target.value) || 0;
                          setBreakdowns(newBreakdowns);
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveBreakdown(index)}
                    disabled={breakdowns.length <= 1}
                    className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestForm;
