import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, FileText, CheckSquare, ListTodo, CreditCard, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: number;
}

export function Sidebar({ isOpen, onClose, currentRole }: SidebarProps) {
  const { logout, user } = useAuth();

  const getNavItems = () => {
    switch (currentRole) {
      case 1:
        return [{ path: '/applicant', label: 'My Requests', icon: FileText }];
      case 2:
        return [{ path: '/manager', label: 'Verification Queue', icon: CheckSquare }];
      case 3:
        return [{ path: '/approver', label: 'Approval Queue', icon: ListTodo }];
      case 4:
        return [{ path: '/accounting', label: 'Payment Processing', icon: CreditCard }];
      case 5:
        return [{ path: '/admin', label: 'User Management', icon: Users }];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-blue-800">
          <h1 className="text-lg font-bold tracking-wider">PRWM System</h1>
          <button onClick={onClose} className="p-1 lg:hidden text-blue-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-800 text-white" 
                  : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 opacity-75" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold text-sm">
                {user?.fullName?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate">{user?.fullName}</p>
               <p className="text-xs text-blue-300 truncate">{user?.branch}</p>
             </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 opacity-75" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
