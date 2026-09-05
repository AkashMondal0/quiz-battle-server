import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  Server,
  Socket,
} from 'socket.io';

import {
  EventsService,
} from './events.service';

@WebSocketGateway({
  namespace: '/event',

  cors: {
    origin: true,
    credentials: true,
  },

  transports: ['websocket'],
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class EventsGateway {
  private readonly logger =
    new Logger(
      EventsGateway.name,
    );

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Socket.IO server initialized.
   */
  afterInit(server: Server): void {
    this.eventsService.setSocket(
      server,
    );

    this.logger.log(
      'Socket.IO server initialized',
    );
  }

  /**
   * Client connected.
   */
  async handleConnection(
    client: Socket,
  ): Promise<void> {
    this.logger.log(
      `Client connected: ${client.id}`,
    );

    try {
      const user =
        this.eventsService.extractUserFromSocket(
          client,
        );

      if (!user) {
        client.emit('connection-error', {
          success: false,
          message:
            'Invalid user information',
        });

        client.disconnect(true);

        return;
      }

      await this.eventsService.registerSocket(
        client,
        user,
      );

      client.emit('connected', {
        success: true,
        socketId: client.id,
        userId: user.id,
      });

      this.logger.log(
        `User connected | ${user.username} | ${user.id} | ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection failed | ${client.id}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      client.disconnect(true);
    }
  }

  /**
   * Client disconnected.
   */
  async handleDisconnect(
    client: Socket,
  ): Promise<void> {
    this.logger.log(
      `Client disconnected: ${client.id}`,
    );

    await this.eventsService.unregisterSocket(
      client,
    );
  }

  /**
   * Normal message.
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: unknown,
  ) {
    this.logger.debug(
      `Message from ${client.id}: ${JSON.stringify(data)}`,
    );

    client.emit('message', {
      success: true,
      data,
    });

    return {
      success: true,
    };
  }

  /**
   * Send message to users.
   */
  @SubscribeMessage('send-message')
  async sendMessage(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      members: string[];
      message: string;
    },
  ) {
    if (
      !Array.isArray(data?.members) ||
      data.members.length === 0
    ) {
      return {
        success: false,
        message:
          'members must be a non-empty array',
      };
    }

    await this.eventsService.sendMessageToUsers(
      data.members,
      {
        senderSocketId: client.id,
        message: data.message,
      },
    );

    return {
      success: true,
    };
  }

  /**
   * ACK example.
   */
  @SubscribeMessage('events')
  handleEvent(
    @MessageBody()
    data: string,
  ) {
    return {
      status: 'received',
      data,
    };
  }

  send(){
    this.server.emit('message', 'Hello World! Events service is working!');
  }
}