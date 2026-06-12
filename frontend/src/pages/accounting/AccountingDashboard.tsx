import React, { useState } from 'react';

export const AccountingDashboard: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<'Yangon' | 'Mandalay'>('Yangon');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">経理ダッシュボード (Accounting Dashboard)</h1>

      {/* Demo toggle to see the alert rules */}
      <div className="mb-4 flex space-x-4 items-center bg-slate-800 p-4 border border-slate-700 rounded">
        <span className="text-slate-300">支店別支払ルール動作テスト用トグル:</span>
        <button
          onClick={() => setSelectedBranch('Yangon')}
          className={`px-3 py-1 rounded ${selectedBranch === 'Yangon' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          Yangon支店 (通常)
        </button>
        <button
          onClick={() => setSelectedBranch('Mandalay')}
          className={`px-3 py-1 rounded ${selectedBranch === 'Mandalay' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          Mandalay支店 (現金)
        </button>
      </div>

      <div className="mb-6">
        {selectedBranch === 'Mandalay' ? (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded text-red-200 font-bold">
            【重要】Mandalay支店：現金支払のため、Toe San氏と調整してください
          </div>
        ) : (
          <div className="p-4 bg-blue-900/40 border border-blue-500 rounded text-blue-200 font-bold">
            標準銀行振込処理
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">最終承認された支払待ちの申請（Approved）の一覧がここに表示されます。</p>
      </div>
    </div>
  );
};
