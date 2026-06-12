import React from 'react';

export const AdminPanel: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">システム管理者パネル (Admin Panel)</h1>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">ユーザーのアカウント管理、マスタテーブル設定、および監査ログ閲覧機能がここに配置されます。</p>
      </div>
    </div>
  );
};
