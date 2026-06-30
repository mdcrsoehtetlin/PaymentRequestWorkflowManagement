import { useEffect, useCallback, useState, useRef } from 'react';
import { wsService } from '../services/websocket.service';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type BackendNotification,
} from '../services/notification-api';

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
  backendId?: number;
  isRead: boolean;
  payload: StatusUpdatePayload | NotificationPayload;
  timestamp: string;
  title?: string;
  link?: string;
}

function mapBackendNotification(n: BackendNotification): FrontendNotification {
  return {
    id: `backend-${n.id}`,
    backendId: n.id,
    isRead: n.isRead,
    payload: {
      message: n.message,
      timestamp: n.createdDate,
    },
    timestamp: n.createdDate,
    title: n.title,
    link: n.link || undefined,
  };
}

export function useWebSocket(userId?: number, role?: string) {
  const [notifications, setNotifications] = useState<FrontendNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const loadedRef = useRef(false);

  // Load persisted notifications from API on mount
  useEffect(() => {
    if (!userId || loadedRef.current) return;
    loadedRef.current = true;

    fetchNotifications()
      .then((data) => {
        const mapped = data.notifications.map(mapBackendNotification);
        setNotifications(mapped);
        setUnreadCount(data.unreadCount);
      })
      .catch((err) => {
        console.error('Failed to fetch notifications', err);
      });
  }, [userId]);

  // Connect WebSocket
  useEffect(() => {
    if (userId && role) {
      wsService.connect(userId, role);
    }
  }, [userId, role]);

  // Listen for real-time WebSocket notifications
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
      const payload = data as {
        notificationId?: number;
        paymentRequestId?: number;
        title?: string;
        message?: string;
        link?: string;
        timestamp?: string;
      };

      // Avoid duplicates: check if this backend notification is already loaded
      if (payload.notificationId) {
        const backendKey = `backend-${payload.notificationId}`;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === backendKey)) return prev;
          return [
            {
              id: backendKey,
              backendId: payload.notificationId,
              isRead: false,
              payload: {
                message: payload.message || '',
                timestamp: payload.timestamp,
              },
              timestamp: payload.timestamp || new Date().toISOString(),
              title: payload.title,
              link: payload.link,
            },
            ...prev,
          ];
        });
      } else {
        setNotifications((prev) => [
          {
            id: Math.random().toString(36).substring(2, 9),
            isRead: false,
            payload: {
              message: payload.message || '',
              timestamp: payload.timestamp,
            },
            timestamp: payload.timestamp || new Date().toISOString(),
            title: payload.title,
            link: payload.link,
          },
          ...prev,
        ]);
      }
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

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const index = prev.findIndex((n) => n.id === id);
        if (index === -1 || prev[index].isRead) return prev;

        const next = [...prev];
        next[index] = { ...next[index], isRead: true };
        return next;
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Persist to backend
      const notif = notifications.find((n) => n.id === id);
      if (notif?.backendId) {
        markNotificationAsRead(notif.backendId).catch((err) => {
          console.error('Failed to mark notification as read', err);
        });
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);

    // Persist to backend
    markAllNotificationsAsRead().catch((err) => {
      console.error('Failed to mark all notifications as read', err);
    });
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
