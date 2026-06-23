import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { StatusUpdatePayload } from '../shared/types';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // or frontend URL
    credentials: true,
  },
})
export class ApplicantGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ApplicantGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Typically we'd verify JWT from query or headers, but for simplicity assuming we decode it
      // For now, client will emit 'joinRoom' with their applicant ID
      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() applicantId: string,
  ) {
    const roomName = `applicant_${applicantId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);
  }

  /**
   * Called by services to broadcast status updates to a specific applicant
   */
  notifyStatusUpdate(applicantId: string, payload: StatusUpdatePayload) {
    const roomName = `applicant_${applicantId}`;
    this.server.to(roomName).emit('statusUpdate', payload);
  }
}
