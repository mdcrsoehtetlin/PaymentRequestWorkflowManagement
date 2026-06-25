import { io, type Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingListeners: Array<{
    event: string;
    callback: (data: unknown) => void;
  }> = [];

  connect(userId: number, role: string): void {
    if (this.socket) return;
    this.socket = io({
      transports: ['websocket'],
      auth: { token: localStorage.getItem('accessToken') },
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.socket?.emit('joinRoom', { role, userId });

      this.pendingListeners.forEach(({ event, callback }) => {
        this.socket?.on(event, callback);
      });
      this.pendingListeners = [];
    });

    this.socket.on('disconnect', () => {
      this.handleReconnect();
    });
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (this.socket && this.socket.connected) {
      this.socket.on(event, callback);
    } else {
      this.pendingListeners.push({ event, callback });
    }
  }

  off(event: string, callback?: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    this.pendingListeners = this.pendingListeners.filter(
      (l) => l.event !== event || (callback && l.callback !== callback),
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.pendingListeners = [];
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
