import React from 'react';

export const ManagerDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">担当マネージャーダッシュボード (Manager Dashboard)</h1>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">確認待ちの申請（Submitted to Manager）の一覧がここに表示されます。</p>
      </div>
    </div>
  );
};
