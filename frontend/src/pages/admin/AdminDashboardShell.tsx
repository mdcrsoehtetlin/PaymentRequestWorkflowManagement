import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/layout/Sidebar';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { Menu } from 'lucide-react';

/**
 * @description Persistent split-dashboard shell for the admin panel.
 * Uses shared Sidebar component with mobile overlay support.
 */
export function AdminDashboardShell() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Shared Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentRole={user.role as string}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div />
          <LanguageSwitcher />
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
