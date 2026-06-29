import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '../../../types';
import { PaymentStatus } from '../types';

const STATUS_I18N_KEY: Record<number, string> = {
  [PaymentStatus.DRAFT]: 'approver.status.draft',
  [PaymentStatus.SUBMITTED_MANAGER]: 'approver.status.submitted_manager',
  [PaymentStatus.MANAGER_REVIEWING]: 'approver.status.manager_reviewing',
  [PaymentStatus.MANAGER_VERIFIED]: 'approver.status.manager_verified',
  [PaymentStatus.REJECTED_MANAGER]: 'approver.status.rejected_manager',
  [PaymentStatus.SUBMITTED_APPROVER]: 'approver.status.submitted_approver',
  [PaymentStatus.APPROVER_REVIEWING]: 'approver.status.approver_reviewing',
  [PaymentStatus.APPROVED]: 'approver.status.approved',
  [PaymentStatus.REJECTED_APPROVER]: 'approver.status.rejected_approver',
  [PaymentStatus.PAID]: 'approver.status.paid',
};

interface ApproverStatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';
}

export function ApproverStatusBadge({ statusId, size = 'md' }: ApproverStatusBadgeProps) {
  const { t } = useTranslation();
  const baseClasses =
    'inline-flex items-center rounded-full font-medium border';
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const colorClasses =
    STATUS_COLORS[statusId as keyof typeof STATUS_COLORS] ??
    'bg-gray-100 text-gray-700 border-gray-200';
  const i18nKey = STATUS_I18N_KEY[statusId];
  const label = i18nKey ? t(i18nKey) : 'Unknown';

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
