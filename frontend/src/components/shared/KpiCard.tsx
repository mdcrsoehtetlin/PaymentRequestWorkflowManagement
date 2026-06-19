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
      className={`relative overflow-hidden rounded-xl border border-slate-200 p-5 shadow-sm 
        ${colorClasses} 
        ${isClickable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
    >
      <div className="relative z-10">
        <h3 className="text-sm font-medium opacity-80 mb-1">{label}</h3>
        <p className="text-3xl font-bold tracking-tight">{count}</p>
      </div>
      <div className="absolute top-4 right-4 opacity-20 [&>svg]:w-10 [&>svg]:h-10">
        {icon}
      </div>
    </div>
  );
}
