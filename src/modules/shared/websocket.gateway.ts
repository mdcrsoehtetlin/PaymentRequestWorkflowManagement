import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { role: string; userId: number },
  ) {
    // Join room based on role (e.g. Managers, Approvers, Accounting)
    client.join(payload.role);
    // Join room based on individual userId
    client.join(`user:${payload.userId}`);
    this.logger.log(`User ${payload.userId} with role ${payload.role} joined rooms.`);
    return { status: 'joined' };
  }

  // Helper method to broadcast status changes to specific roles or users
  sendStatusUpdate(role: string, message: any) {
    this.server.to(role).emit('statusUpdate', message);
  }

  sendPersonalNotification(userId: number, message: any) {
    this.server.to(`user:${userId}`).emit('notification', message);
  }
}
