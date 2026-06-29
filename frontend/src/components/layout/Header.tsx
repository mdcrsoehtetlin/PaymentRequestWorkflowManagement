import { Menu, Bell, CheckCircle } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { StatusUpdatePayload, NotificationPayload, FrontendNotification } from '../../hooks/useWebSocket';

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
  notifications?: FrontendNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  userRole?: string;
}

export function Header({ onMenuToggle, notificationCount = 0, notifications = [], onMarkAsRead, onMarkAllAsRead, userRole }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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
  };

  const getStatusKey = (statusId: number | null): string => {
    switch (statusId) {
      case 1: return 'draft';
      case 2: return 'submitted_manager';
      case 3: return 'manager_reviewing';
      case 4: return 'manager_verified';
      case 5: return 'rejected_manager';
      case 6: return 'submitted_approver';
      case 7: return 'approver_reviewing';
      case 8: return 'approved';
      case 9: return 'rejected_approver';
      case 10: return 'paid';
      default: return '';
    }
  };

  const getNotificationText = (payload: StatusUpdatePayload | NotificationPayload) => {
    if ('message' in payload) return payload.message;
    const statusKey = getStatusKey(payload.newStatusId);
    const statusText = statusKey ? t(`common.statuses.${statusKey}`) : payload.newStatusId;
    return `Request ${payload.requestNumber || payload.paymentRequestId} updated to ${statusText}`;
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
                <h3 className="font-bold text-slate-800">{t('header.notifications')}</h3>
                <div className="flex items-center gap-2">
                  {notificationCount > 0 && (
                    <button 
                      onClick={onMarkAllAsRead} 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {t('header.mark_all_read')}
                    </button>
                  )}
                  <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{t('header.new_count', { count: notificationCount })}</span>
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.map((noti) => {
                      const payload = noti.payload;
                      let url = '#';
                      if (userRole && 'paymentRequestId' in payload) {
                        const rolePath = userRole.toLowerCase();
                        url = rolePath === 'accounting' 
                          ? `/accounting/payment/${payload.paymentRequestId}`
                          : `/${rolePath}/requests/${payload.paymentRequestId}`;
                      }

                      return (
                        <Link
                          key={noti.id}
                          to={url}
                          onClick={() => {
                            onMarkAsRead?.(noti.id);
                            setIsOpen(false);
                          }}
                          className={`p-4 border-b border-slate-50 transition-colors flex gap-3 items-start ${
                            noti.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 p-1.5 rounded-full ${
                            noti.isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-snug ${
                              noti.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'
                            }`}>
                              {getNotificationText(payload)}
                            </p>
                            <p className={`text-xs mt-1 ${
                              noti.isRead ? 'text-slate-400' : 'text-blue-500'
                            }`}>
                              {noti.timestamp ? new Date(noti.timestamp).toLocaleTimeString() : 'Just now'}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                    <CheckCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm">{t('header.all_caught_up')}</p>
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
