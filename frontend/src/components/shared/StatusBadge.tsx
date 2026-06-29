import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '../../types';

interface StatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';
}

/**
 * @description Renders a payment request status as a colored inline badge.
 * Color is driven by the STATUS_COLORS constant, which must exactly match
 * the design system in DD_COMMON_05 §2.1.
 * Label is translated using i18n.
 *
 * @param statusId - The status_id integer from the database
 * @param size - 'sm' for compact tables, 'md' (default) for detail views
 */
export function StatusBadge({ statusId, size = 'md' }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  const baseClasses =
    'inline-flex items-center rounded-full font-medium border';
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';
  const colorClasses =
    STATUS_COLORS[statusId as keyof typeof STATUS_COLORS] ??
    'bg-gray-100 text-gray-700 border-gray-200';
  
  const statusKey = getStatusKey(statusId);
  const label = statusKey ? t(`common.statuses.${statusKey}`) : t('common.unknown');

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

function getStatusKey(statusId: number): string | null {
  const statusMap: Record<number, string> = {
    1: 'draft',
    2: 'submitted_manager',
    3: 'manager_reviewing',
    4: 'manager_verified',
    5: 'rejected_manager',
    6: 'submitted_approver',
    7: 'approver_reviewing',
    8: 'approved',
    9: 'rejected_approver',
    10: 'paid',
  };
  return statusMap[statusId] ?? null;
}
