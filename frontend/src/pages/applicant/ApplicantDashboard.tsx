import React from 'react';

export const ApplicantDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Applicant Dashboard</h1>
        <button className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded text-white font-medium transition shadow-sm">
          Create New Request
        </button>
      </div>
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <p className="text-slate-500">A list of your application history and drafts will appear here.</p>
      </div>
    </div>
  );
};
