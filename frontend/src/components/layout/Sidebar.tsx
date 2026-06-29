import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
}

function useRoleMenuConfig() {
  const { t } = useTranslation();
  return {
    APPROVER: {
      title: t('sidebar.approver_console'),
      dashboardPath: '/approver',
      menuItems: [],
    },
    MANAGER: {
      title: t('sidebar.manager_console'),
      dashboardPath: '/manager',
      menuItems: [],
    },
    ACCOUNTING: {
      title: t('sidebar.accounting_console'),
      dashboardPath: '/accounting',
      menuItems: [
        { label: t('sidebar.dashboard'), path: '/accounting' },
      ],
    },
    ADMIN: {
      title: t('sidebar.admin_console'),
      dashboardPath: '/admin',
      menuItems: [
        { label: t('admin.sidebar.user_management'), path: '/admin/users' },
        { label: t('admin.sidebar.master_data'), path: '/admin/master-data' },
        { label: t('admin.sidebar.audit_logs'), path: '/admin/audit-logs' },
      ],
    },
    APPLICANT: {
      title: t('sidebar.applicant_console'),
      dashboardPath: '/applicant',
      menuItems: [
        { label: t('sidebar.dashboard'), path: '/applicant' },
        { label: t('sidebar.new_request'), path: '/applicant/form' },
      ],
    },
  };
}

export function Sidebar({ isOpen, onClose, currentRole }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const roleMenuConfig = useRoleMenuConfig();

  const roleConfig = roleMenuConfig[currentRole as keyof typeof roleMenuConfig] ?? roleMenuConfig.APPLICANT;
  const title = roleConfig.title;
  const dashboardPath = roleConfig.dashboardPath;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-5 border-b border-blue-800">
            <p className="font-bold text-lg tracking-wider">{title}</p>
            <p className="text-xs text-blue-300 mt-0.5">{t('sidebar.system_name')}</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {roleConfig.menuItems.length === 0 ? (
              <NavLink
                to={dashboardPath}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`
                }
              >
                {t('sidebar.dashboard')}
              </NavLink>
            ) : (
              roleConfig.menuItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))
            )}
          </nav>

          <div className="mt-auto p-4 border-t border-blue-800">
            <div className="px-2 mb-3">
              <p className="text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-2 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('sidebar.logout')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
