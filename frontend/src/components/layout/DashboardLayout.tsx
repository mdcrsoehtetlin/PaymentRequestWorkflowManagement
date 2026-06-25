import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useWebSocket(user?.sub, user?.role);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (fixed on desktop, overlay on mobile) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentRole={user.role as string}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <Header
          onMenuToggle={() => setIsSidebarOpen(true)}
          notificationCount={unreadCount}
          notifications={notifications}
          onMarkAsRead={markAsRead}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
