import React, { useState } from 'react';

export const AccountingDashboard: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<'Yangon' | 'Mandalay'>('Yangon');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Accounting Dashboard</h1>

      {/* Demo toggle to see the alert rules */}
      <div className="mb-4 flex space-x-4 items-center bg-white p-4 border border-slate-200 shadow-sm rounded-lg">
        <span className="text-slate-900 font-medium">Branch specific payment rule test toggle:</span>
        <button
          onClick={() => setSelectedBranch('Yangon')}
          className={`px-3 py-1 rounded transition ${selectedBranch === 'Yangon' ? 'bg-blue-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          Yangon Branch (Standard)
        </button>
        <button
          onClick={() => setSelectedBranch('Mandalay')}
          className={`px-3 py-1 rounded transition ${selectedBranch === 'Mandalay' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          Mandalay Branch (Cash)
        </button>
      </div>

      <div className="mb-6">
        {selectedBranch === 'Mandalay' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 font-bold">
            [IMPORTANT] Mandalay Branch: Cash payment required. Please coordinate with Mr. Toe San.
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 font-bold">
            Standard Bank Transfer Processing
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <p className="text-slate-500">A list of approved applications awaiting payment will appear here.</p>
      </div>
    </div>
  );
};
