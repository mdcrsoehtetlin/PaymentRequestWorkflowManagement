import { useEffect, useCallback, useState } from 'react';
import { wsService } from '../services/websocket.service';

export interface StatusUpdatePayload {
  paymentRequestId: number | string;
  requestNumber?: string;
  previousStatusId?: number;
  newStatusId: number;
  actionByUserId?: number;
  actionByUserName?: string;
  timestamp?: string;
}

export interface NotificationPayload {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  timestamp?: string;
  data?: Record<string, unknown>;
}

export interface FrontendNotification {
  id: string;
  isRead: boolean;
  payload: StatusUpdatePayload | NotificationPayload;
  timestamp: string;
}

export function useWebSocket(userId?: number, role?: string) {
  const [notifications, setNotifications] = useState<FrontendNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId && role) {
      wsService.connect(userId, role);
    }
    return () => {
      // Intentionally not disconnecting here to avoid breaking shared singleton
      // connection when individual components unmount.
    };
  }, [userId, role]);

  useEffect(() => {
    const handleStatusUpdate = (data: unknown) => {
      const payload = data as StatusUpdatePayload;
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          isRead: false,
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotification = (data: unknown) => {
      const payload = data as NotificationPayload;
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          isRead: false,
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    wsService.on('request:status-changed', handleStatusUpdate);
    wsService.on('request:approved', handleStatusUpdate);
    wsService.on('request:rejected', handleStatusUpdate);
    wsService.on('request:new-submission', handleStatusUpdate);
    wsService.on('notification', handleNotification);

    return () => {
      wsService.off('request:status-changed', handleStatusUpdate);
      wsService.off('request:approved', handleStatusUpdate);
      wsService.off('request:rejected', handleStatusUpdate);
      wsService.off('request:new-submission', handleStatusUpdate);
      wsService.off('notification', handleNotification);
    };
  }, []);

  const onStatusUpdate = useCallback(
    (callback: (data: StatusUpdatePayload) => void) => {
      const wrapper = (data: unknown) => callback(data as StatusUpdatePayload);
      wsService.on('request:status-changed', wrapper);
      return () => wsService.off('request:status-changed', wrapper);
    },
    [],
  );

  const onNotification = useCallback(
    (eventName: string, callback: (data: NotificationPayload) => void) => {
      const wrapper = (data: unknown) => callback(data as NotificationPayload);
      wsService.on(eventName, wrapper);
      return () => wsService.off(eventName, wrapper);
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const index = prev.findIndex((n) => n.id === id);
      if (index === -1 || prev[index].isRead) return prev;

      const next = [...prev];
      next[index] = { ...next[index], isRead: true };
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    onStatusUpdate,
    onNotification,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
