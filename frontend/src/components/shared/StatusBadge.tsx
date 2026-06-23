import { STATUS_LABELS_JP, STATUS_COLORS } from '../../types';

interface StatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';
}

/**
 * @description Renders a payment request status as a colored inline badge.
 * Color and label are driven by the STATUS_COLORS and STATUS_LABELS_EN
 * constants, which must exactly match the design system in DD_COMMON_05 §2.1.
 *
 * @param statusId - The status_id integer from the database
 * @param size - 'sm' for compact tables, 'md' (default) for detail views
 */
export function StatusBadge({ statusId, size = 'md' }: StatusBadgeProps) {
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
