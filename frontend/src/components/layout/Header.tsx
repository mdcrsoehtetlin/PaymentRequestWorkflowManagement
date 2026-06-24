import { Menu, Bell, CheckCircle } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { useState, useRef, useEffect } from 'react';
import type { StatusUpdatePayload, NotificationPayload } from '../../hooks/useWebSocket';

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
  notifications?: (StatusUpdatePayload | NotificationPayload)[];
  onMarkAsRead?: () => void;
}

export function Header({ onMenuToggle, notificationCount = 0, notifications = [], onMarkAsRead }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && onMarkAsRead) {
      onMarkAsRead();
    }
  };

  const getNotificationText = (n: StatusUpdatePayload | NotificationPayload) => {
    if ('message' in n) return n.message;
    return `Request ${n.requestNumber || n.paymentRequestId} updated to status ${n.newStatusId}`;
  };

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

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleToggle}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white box-content"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 transform opacity-100 scale-100 transition-all">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{notifications.length} new</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.map((noti, index) => (
                      <div key={index} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start">
                        <div className="mt-0.5 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-snug">
                            {getNotificationText(noti)}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {noti.timestamp ? new Date(noti.timestamp).toLocaleTimeString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                    <CheckCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
