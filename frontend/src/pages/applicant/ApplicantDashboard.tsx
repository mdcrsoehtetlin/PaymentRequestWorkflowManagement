import React from 'react';

export const ApplicantDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-100">支払申請ダッシュボード (Applicant Dashboard)</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium shadowTransition">
          新規申請作成
        </button>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">申請履歴や下書きの一覧がここに表示されます。</p>
      </div>
    </div>
  );
};
