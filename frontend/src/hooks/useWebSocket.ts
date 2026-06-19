import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket.service';

// Mock types for websocket payloads
interface StatusUpdatePayload {
  paymentRequestId: number;
  newStatusId: number;
}
interface NotificationPayload {
  message: string;
}

export function useWebSocket(userId: number, role: string) {
  useEffect(() => {
    wsService.connect(userId, role);
    return () => wsService.disconnect();
  }, [userId, role]);

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

  return { onStatusUpdate, onNotification };
}
