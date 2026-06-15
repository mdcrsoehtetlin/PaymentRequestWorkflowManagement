import React from 'react';

export const AdminPanel: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel</h1>
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <p className="text-slate-500">User account management, master table settings, and audit log viewing functions will be placed here.</p>
      </div>
    </div>
  );
};
