import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove user from map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.userSockets.set(userId, client.id);
    console.log(`User ${userId} authenticated with socket ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { recipientId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const recipientSocketId = this.userSockets.get(data.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('message', data);
    }
  }

  // Send notification to specific user
  sendNotification(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // Broadcast message to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
