import React from 'react';
import { STATUS_LABELS_JP, STATUS_COLORS } from '../../utils/constants';

interface StatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';
}

export function StatusBadge({ statusId, size = 'md' }: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const colorClasses = STATUS_COLORS[statusId] || 'bg-slate-100 text-slate-800';
  const label = STATUS_LABELS_JP[statusId] || '不明';

  return (
    <span
      className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
}
