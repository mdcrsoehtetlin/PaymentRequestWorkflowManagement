import { useEffect, useState, useRef } from 'react';
import { wsService } from '../../../services/websocket.service';
import { useToast } from '../../../hooks/useToast';

interface SocketPayload {
  event: 'statusUpdate' | 'row-removed';
  paymentRequestId: number;
  requestNumber?: string;
  previousStatusId?: number;
  newStatusId?: number;
  timestamp: string;
}

/**
 * Hook to manage real-time WebSocket connection and events for the Accounting Queue.
 * Falls back to 60-second polling when the WebSocket connection is disconnected.
 */
export function useAccountingWebSockets(
  userId: number | undefined,
  role: string | undefined,
  onRefresh: () => void,
) {
  const [isConnected, setIsConnected] = useState(false);
  const { info } = useToast();
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!userId || !role) {
      return undefined;
    }

    wsService.connect(userId, role);
    setIsConnected(true);

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleStatusChanged = (data: unknown) => {
      const payload = data as SocketPayload;
      if (payload) {
        if (payload.event === 'statusUpdate') {
          // If status transitions to APPROVED (8)
          if (payload.newStatusId === 8) {
            info(`New payment request approved: ${payload.requestNumber || `#${payload.paymentRequestId}`}`);
          }
          onRefreshRef.current();
        } else if (payload.event === 'row-removed') {
          onRefreshRef.current();
        } else {
          onRefreshRef.current();
        }
      }
    };

    wsService.on('connect', handleConnect);
    wsService.on('disconnect', handleDisconnect);
    wsService.on('request:status-changed', handleStatusChanged);

    return () => {
      wsService.off('connect', handleConnect);
      wsService.off('disconnect', handleDisconnect);
      wsService.off('request:status-changed', handleStatusChanged);
      wsService.disconnect();
    };
  }, [userId, role]);

  // Fallback 60s polling when disconnected
  useEffect(() => {
    if (isConnected) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      onRefreshRef.current();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [isConnected]);

  return { isConnected };
}
