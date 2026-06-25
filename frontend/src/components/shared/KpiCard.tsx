import React from 'react';

interface KpiCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClasses: string;
  onClick?: () => void;
}

export function KpiCard({ label, count, icon, colorClasses, onClick }: KpiCardProps) {
  const isClickable = !!onClick;
  
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between ${
        isClickable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
      }`}
    >
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${colorClasses}`}>
        {icon}
      </div>
    </div>
  );
}
