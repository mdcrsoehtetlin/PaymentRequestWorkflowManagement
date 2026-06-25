import { io, type Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: number, role: string): void {
    if (this.socket) return;
    this.socket = io('/socket.io', {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('accessToken') },
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.socket?.emit('joinRoom', { role, userId });
    });

    this.socket.on('disconnect', () => {
      this.handleReconnect();
    });
  }

  on(event: string, callback: (data: unknown) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void): void {
    this.socket?.off(event, callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    setTimeout(() => {
      this.reconnectAttempts++;
      this.socket?.connect();
    }, delay);
  }
}

export const wsService = new WebSocketService();
