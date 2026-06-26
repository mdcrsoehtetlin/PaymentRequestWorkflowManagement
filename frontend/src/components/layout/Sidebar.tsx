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
      title: 'Approver Console',
      dashboardPath: '/approver',
      menuItems: [],
    },
    MANAGER: {
      title: 'Manager Console',
      dashboardPath: '/manager',
      menuItems: [],
    },
    ACCOUNTING: {
      title: 'Accounting Console',
      dashboardPath: '/accounting',
      menuItems: [
        { label: 'Dashboard', path: '/accounting' },
      ],
    },
    ADMIN: {
      title: 'Admin Console',
      dashboardPath: '/admin',
      menuItems: [
        { label: t('admin.sidebar.user_management'), path: '/admin/users' },
        { label: t('admin.sidebar.master_data'), path: '/admin/master-data' },
        { label: t('admin.sidebar.audit_logs'), path: '/admin/audit-logs' },
      ],
    },
    APPLICANT: {
      title: 'Applicant Console',
      dashboardPath: '/applicant',
      menuItems: [
        { label: 'Dashboard', path: '/applicant' },
        { label: 'New Application', path: '/applicant/form' },
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
            <p className="text-xs text-blue-300 mt-0.5">PRWM System</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {roleConfig.menuItems.length === 0 ? (
              <a
                href={dashboardPath}
                onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname === dashboardPath) {
                    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
                  } else {
                    navigate(dashboardPath);
                  }
                  onClose();
                }}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-800 text-white transition-colors"
              >
                {t('sidebar.dashboard')}
              </NavLink>
            ) : (
              roleConfig.menuItems.map((item) => (
                <NavLink
                  key={item.label}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.location.pathname === item.path) {
                      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
                    } else {
                      navigate(item.path);
                    }
                    onClose();
                  }}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
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
