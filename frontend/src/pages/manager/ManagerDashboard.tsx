import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function ManagerDashboard() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">Welcome to your dashboard. Here you can verify payment requests submitted by your team.</p>
      </div>
    </DashboardLayout>
  );
}
