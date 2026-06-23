import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
}

export function Sidebar({ isOpen, onClose, currentRole }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  // Basic menu items (would be dynamic based on role)
  const menuItems = [
    { label: t('sidebar.dashboard'), path: '/', active: true },
    { label: t('sidebar.request_list'), path: '/requests', active: false },
    { label: t('sidebar.new_request'), path: '/requests/new', active: false },
  ];

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
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 font-bold text-xl tracking-wider border-b border-blue-800">
            PRWM System
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  // Routing would happen here
                  onClose();
                }}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-blue-300 truncate">{currentRole}</p>
              </div>
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
