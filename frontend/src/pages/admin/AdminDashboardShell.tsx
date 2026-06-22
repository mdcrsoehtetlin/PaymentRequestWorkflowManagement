import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Shield } from 'lucide-react';

/**
 * @description Persistent split-dashboard shell for the admin panel.
 * Left sidebar with navigation, right side swaps workspace via React Router sub-routes.
 */
export function AdminDashboardShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/users', label: 'ユーザー管理' },
    { to: '/admin/master-data', label: 'マスターデータ' },
    { to: '/admin/audit-logs', label: '監査ログ' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E3A8A] text-white flex flex-col">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <span className="text-lg font-bold">Admin Console</span>
          </div>
          <p className="text-xs text-blue-200 mt-1">PRWM System</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800">
          <div className="px-3 py-2 text-sm text-blue-200">
            <p className="font-medium text-white">{user?.fullName}</p>
            <p className="text-xs">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-blue-100 hover:bg-blue-700/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
