import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let styles = '';
        let Icon = Info;

        switch (toast.type) {
          case 'success':
            styles = 'bg-emerald-50 border-emerald-200 text-emerald-800';
            Icon = CheckCircle;
            break;
          case 'error':
            styles = 'bg-red-50 border-red-200 text-red-800';
            Icon = XCircle;
            break;
          case 'warning':
            styles = 'bg-amber-50 border-amber-200 text-amber-800';
            Icon = AlertTriangle;
            break;
          case 'info':
            styles = 'bg-blue-50 border-blue-200 text-blue-800';
            Icon = Info;
            break;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 border rounded-lg shadow-lg transform transition-all animate-slide-in-right ${styles}`}
            role="alert"
          >
            <Icon className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-3 shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
