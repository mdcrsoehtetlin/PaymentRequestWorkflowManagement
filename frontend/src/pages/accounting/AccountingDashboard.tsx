import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function AccountingDashboard() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Accounting Dashboard</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">Welcome to your dashboard. Here you can process payments for approved requests.</p>
      </div>
    </DashboardLayout>
  );
}
