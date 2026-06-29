import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  branch: string;
}

export const BranchAlertBanner: React.FC<Props> = ({ branch }) => {
  const { t } = useTranslation();

  if (branch === 'Mandalay') {
    return (
      <div
        role="alert"
        className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold">
          {t('accounting.branch_alert.mandalay')}
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-900"
    >
      <Info
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold">{t('accounting.branch_alert.default')}</p>
    </div>
  );
};
