import { STATUS_COLORS } from '../../../types';
import { STATUS_LABELS_EN } from '../types';

interface ApproverStatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';
}

export function ApproverStatusBadge({ statusId, size = 'md' }: ApproverStatusBadgeProps) {
  const baseClasses =
    'inline-flex items-center rounded-full font-medium border';
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const colorClasses =
    STATUS_COLORS[statusId as keyof typeof STATUS_COLORS] ??
    'bg-gray-100 text-gray-700 border-gray-200';
  const label = STATUS_LABELS_EN[statusId as keyof typeof STATUS_LABELS_EN] ?? 'Unknown';

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
