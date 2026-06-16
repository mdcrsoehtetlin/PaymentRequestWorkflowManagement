import React from 'react';
import { Bell, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
}

export function Header({ onMenuToggle, notificationCount = 0 }: HeaderProps) {
  const { user } = useAuth();

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Applicant',
      2: 'Manager',
      3: 'Final Approver',
      4: 'Accounting',
      5: 'System Admin'
    };
    return roles[roleId] || 'User';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center lg:hidden">
        <button onClick={onMenuToggle} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex items-center justify-end flex-1 gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user ? getRoleName(user.roleId) : ''}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
