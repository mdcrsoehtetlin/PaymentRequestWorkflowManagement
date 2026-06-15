import React from 'react';

export const ManagerDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Manager Dashboard</h1>
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <p className="text-slate-500">A list of applications pending your review (Submitted to Manager) will appear here.</p>
      </div>
    </div>
  );
};
