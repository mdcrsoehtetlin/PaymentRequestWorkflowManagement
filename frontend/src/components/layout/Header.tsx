import { Menu, Bell } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
}

export function Header({ onMenuToggle, notificationCount = 0 }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger (mobile/tablet) */}
      <div className="flex items-center md:hidden">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right side: Language, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <div className="hidden sm:block border-r border-slate-200 pr-2">
          <LanguageSwitcher />
        </div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white box-content"></span>
          )}
        </button>
      </div>
    </header>
  );
}
