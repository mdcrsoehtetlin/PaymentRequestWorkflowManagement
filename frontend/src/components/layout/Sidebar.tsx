import { LogOut, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const allMenuItems = [
    { label: t('sidebar.dashboard'), path: '/', roles: ['APPLICANT', 'MANAGER', 'APPROVER', 'ACCOUNTING'] },
    { label: t('sidebar.request_list'), path: '/requests', roles: ['APPLICANT', 'APPROVER', 'ACCOUNTING'] },
    { label: t('sidebar.new_request'), path: '/requests/new', roles: ['APPLICANT'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role as string));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-5 border-b border-blue-800">
            <div className="flex items-center gap-2.5">
              <Shield className="h-6 w-6 text-blue-300 shrink-0" />
              <span className="text-lg font-bold tracking-wide">Manager Dashboard</span>
            </div>
            <p className="text-xs text-blue-400 mt-1 ml-[38px]">PRWM System</p>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-blue-800">
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
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
