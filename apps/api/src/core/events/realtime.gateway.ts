import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  private readonly server!: Server;

  publish(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }

  publishToTrip(tripId: string, event: string, payload: unknown) {
    this.server.to(this.tripRoom(tripId)).emit(event, payload);
  }

  @SubscribeMessage('tracking:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId?: string },
  ) {
    if (data?.tripId) {
      void client.join(this.tripRoom(data.tripId));
    }

    return { event: 'tracking:subscribed', data: { tripId: data?.tripId } };
  }

  @SubscribeMessage('tracking:unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId?: string },
  ) {
    if (data?.tripId) {
      void client.leave(this.tripRoom(data.tripId));
    }

    return { event: 'tracking:unsubscribed', data: { tripId: data?.tripId } };
  }

  private tripRoom(tripId: string) {
    return `trip:${tripId}`;
  }
}
