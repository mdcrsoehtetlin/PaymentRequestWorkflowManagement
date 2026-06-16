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
      wsService.on('statusUpdate', callback);
      return () => wsService.off('statusUpdate', callback);
    },
    [],
  );

  const onNotification = useCallback(
    (callback: (data: NotificationPayload) => void) => {
      wsService.on('notification', callback);
      return () => wsService.off('notification', callback);
    },
    [],
  );

  return { onStatusUpdate, onNotification };
}
