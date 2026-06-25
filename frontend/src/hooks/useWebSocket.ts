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

export function useWebSocket(userId?: number, role?: string) {
  const [notifications, setNotifications] = useState<
    (StatusUpdatePayload | NotificationPayload)[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId && role) {
      wsService.connect(userId, role);
    }
    return () => {
      if (userId && role) {
        wsService.disconnect();
      }
    };
  }, [userId, role]);

  useEffect(() => {
    const handleStatusUpdate = (data: unknown) => {
      const payload = data as StatusUpdatePayload;
      setNotifications((prev) => [
        {
          ...payload,
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
          ...payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    wsService.on('request:status-changed', handleStatusUpdate);
    wsService.on('request:approved', handleStatusUpdate);
    wsService.on('request:rejected', handleStatusUpdate);
    wsService.on('notification', handleNotification);

    return () => {
      wsService.off('request:status-changed', handleStatusUpdate);
      wsService.off('request:approved', handleStatusUpdate);
      wsService.off('request:rejected', handleStatusUpdate);
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

  const markAsRead = useCallback(() => {
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
    clearNotifications,
  };
}
