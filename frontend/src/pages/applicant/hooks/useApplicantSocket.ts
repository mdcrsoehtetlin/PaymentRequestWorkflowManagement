import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Assuming the API base URL matches the socket server
const SOCKET_URL = 'http://localhost:3005';

export interface StatusUpdatePayload {
  paymentRequestId: string;
  requestNumber: string;
  previousStatusId: number;
  newStatusId: number;
  actionByUserId: number;
  actionByUserName: string;
  timestamp: string;
}

export const useApplicantSocket = (applicantId: string = '1') => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<StatusUpdatePayload | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      socketInstance.emit('joinRoom', applicantId);
    });

    socketInstance.on('statusUpdate', (payload: StatusUpdatePayload) => {
      console.log('Received status update via socket:', payload);
      setLastUpdate(payload);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [applicantId]);

  return { socket, lastUpdate, clearLastUpdate: () => setLastUpdate(null) };
};
