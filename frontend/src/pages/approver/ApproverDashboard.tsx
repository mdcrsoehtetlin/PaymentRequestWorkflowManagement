import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function ApproverDashboard() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.approver.title')}</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">{t('dashboard.approver.welcome_message')}</p>
      </div>
    </DashboardLayout>
  );
}
