import { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface UseToastReturn {
  toasts: ToastMessage[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

let globalToasts: ToastMessage[] = [];
let listeners: ((toasts: ToastMessage[]) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach((l) => l([...globalToasts]));
};

export const triggerGlobalToast = (
  type: ToastMessage['type'],
  message: string,
) => {
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  globalToasts = [...globalToasts, { id, type, message }];
  notifyListeners();
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 4000);
};

export const dismissGlobalToast = (id: string) => {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  notifyListeners();
};

if (typeof window !== 'undefined') {
  window.addEventListener('globalToast', ((e: CustomEvent) => {
    triggerGlobalToast(e.detail.type, e.detail.message);
  }) as EventListener);
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>(globalToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const success = useCallback(
    (msg: string) => triggerGlobalToast('success', msg),
    [],
  );
  const error = useCallback(
    (msg: string) => triggerGlobalToast('error', msg),
    [],
  );
  const warning = useCallback(
    (msg: string) => triggerGlobalToast('warning', msg),
    [],
  );
  const info = useCallback(
    (msg: string) => triggerGlobalToast('info', msg),
    [],
  );
  const dismiss = useCallback((id: string) => dismissGlobalToast(id), []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    dismiss,
  };
}
