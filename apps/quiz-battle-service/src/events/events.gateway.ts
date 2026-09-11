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
import { QuizBattleService } from '../quiz-battle-service.service';

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
    private readonly quizBattleService: QuizBattleService

  ) { }

  afterInit(server: Server): void {
    this.eventsService.setSocket(
      server,
    );

    this.logger.log(
      'Socket.IO server initialized',
    );
  }

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


  @SubscribeMessage('battle:join')
  handleJoinRoom(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    data: {
      roomId: string;
    },
  ) {

    const user = this.eventsService.extractUserFromSocket(
      client,
    );

    if (!user) {
      this.logger.warn(
        `Invalid user information for client: ${client.id}`,
      );

      return;
    }

    this.quizBattleService.joinRoom(data.roomId, {
      userId: user?.id as string,
      username: user?.username as string,
      profilePicture: user?.profilePicture as string | null,
      avatarId: user?.avatarId as string | null,
    }, (async (state) => {
      const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map(p => p.userId));
      this.server.to(socketIds).emit('battle:lobby', state);
    }));
    setTimeout(() => {
      this.quizBattleService.joinRoom(data.roomId, {
        userId: user?.id as string,
        username: user?.username as string,
        profilePicture: user?.profilePicture as string | null,
        avatarId: user?.avatarId as string | null,
      }, (async (state) => {
        const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map(p => p.userId));
        this.server.to(socketIds).emit('battle:lobby', state);
      }));
    }, 1000)
  }

  @SubscribeMessage('battle:create')
  handleCreateRoom(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      topic: string;
      aiModelId: string;
      aiBackendId: string;
      gameMode: string;
      playerCount: number;
      difficulty: string;
      questionCount: number;
      secondsPerQuestion: number;
      isPrivate: boolean;
    }
  ) {

    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      return;
    }

    setTimeout(() => {
      this.quizBattleService.createRoom({
        aiId: data.aiModelId,
        mode: data.gameMode,
        difficulty: data.difficulty,
        visibility: data.isPrivate ? 'private' : 'public',
        maxPlayers: data.playerCount,
        topic: data.topic,
        prompt: "",
        host: {
          userId: user.id as string,
          username: user.username as string,
          profilePicture: user.profilePicture as string | null,
          avatarId: user.avatarId as string | null,
        },
        numberOfQuestions: data.questionCount,
        totalTimeSeconds: data.secondsPerQuestion * data.questionCount,
      }, (state) => {
        // console.log("Sending room state to client:", state);
        this.server.to(client.id).emit('battle:lobby', state);
      })
    }, 1000)
  }

  send() {
    this.server.emit('message', 'Hello World! Events service is working!');
  }
}