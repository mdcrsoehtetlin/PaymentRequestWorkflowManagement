import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentRole={user?.roleId || 0} 
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        
        <footer className="py-4 text-center border-t border-slate-200 text-sm text-slate-500 bg-white">
          &copy; {new Date().getFullYear()} Payment Request Workflow Management System
        </footer>
      </div>
    </div>
  );
}
