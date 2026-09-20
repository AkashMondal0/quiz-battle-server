import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
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
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly eventsService: EventsService,
    private readonly quizBattleService: QuizBattleService,
  ) {}

  afterInit(server: Server): void {
    this.eventsService.setSocket(server);

    this.logger.log('Socket.IO server initialized');
  }

  async handleError(message: string, client: Socket): Promise<void> {
    this.server.to(client.id).emit('battle:error', {
      success: false,
      message: message,
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const user = this.eventsService.extractUserFromSocket(client);

      if (!user) {
        this.handleError(
          `Invalid user information for client: ${client.id}`,
          client,
        );
        client.disconnect(true);

        return;
      }

      await this.eventsService.registerSocket(client, user);

      client.emit('connected', {
        success: true,
        socketId: client.id,
        userId: user.id,
      });

      // reconnect game
      await this.quizBattleService.checkReconnectGame(
        user.id,
        Date.now(),
        (state) => {
          client.emit('battle:reconnect-response', state);
        },
        (errorMessage) => {
          this.handleError(errorMessage, client);
        },
      );

      this.logger.log(
        `User connected | ${user.username} | ${user.id} | ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection failed | ${client.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);

    await this.eventsService.unregisterSocket(client);
  }

  @SubscribeMessage('test:error')
  async sendErrorAll(): Promise<void> {
    this.server.emit('battle:error', {
      success: false,
      message: 'An error occurred while processing the request',
    });
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
    },
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while creating the room`, client);
      return;
    }

    setTimeout(() => {
      this.quizBattleService.createRoom(
        {
          aiId: data.aiModelId,
          mode: data.gameMode,
          difficulty: data.difficulty,
          visibility: data.isPrivate ? 'private' : 'public',
          maxPlayers: data.playerCount,
          topic: data.topic,
          prompt: '',
          host: {
            userId: user.id as string,
            username: user.username as string,
            avatar: user.avatar as string | null,
            avatarId: user.avatarId as string | null,
          },
          numberOfQuestions: data.questionCount,
          totalTimeSeconds: data.secondsPerQuestion * data.questionCount,
        },
        (state) => {
          // console.log("Sending room state to client:", state);
          this.server.to(client.id).emit('battle:lobby', state);
        },
        (errorMessage) => {
          this.handleError(errorMessage, client);
        },
      );
    }, 1000);
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
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError('An error occurred while joining the room', client);
      return;
    }

    this.quizBattleService.joinRoom(
      data.roomId,
      {
        userId: user?.id as string,
        username: user?.username as string,
        avatar: user?.avatar as string | null,
        avatarId: user?.avatarId as string | null,
      },
      async (state) => {
        const socketIds = (
          await this.eventsService.findSocketIdsByUserIds(
            state.players.map((p) => p.userId),
          )
        ).filter((id) => id !== user.id);
        // send a message to all players in the room with the updated state
        this.server.to(socketIds).emit('battle:lobby', state);
        // join user to the room
        client.emit('battle:joined-response', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }

  @SubscribeMessage('battle:ready')
  handleReady(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      ready: boolean;
      roomId: string;
    },
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while setting ready status`, client);
      return;
    }

    this.quizBattleService.setPlayerReady(
      {
        roomId: data.roomId,
        userId: user.id as string,
        ready: data.ready,
      },
      async (state) => {
        const socketIds = await this.eventsService.findSocketIdsByUserIds(
          state.players.map((p) => p.userId),
        );
        this.server.to(socketIds).emit('battle:lobby-updated', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }

  @SubscribeMessage('battle:game-start')
  handleStart(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      roomId: string;
    },
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while starting the match`, client);
      return;
    }

    this.quizBattleService.startMatch(
      {
        roomId: data.roomId,
        userId: user.id as string,
      },
      async (state) => {
        const socketIds = await this.eventsService.findSocketIdsByUserIds(
          state.players.map((p) => p.userId),
        );
        this.server.to(socketIds).emit('battle:game-start', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }

  @SubscribeMessage('battle:leave')
  handleLeave(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      roomId: string;
    },
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while leaving the match`, client);
      return;
    }

    this.quizBattleService.leaveRoom(
      {
        roomId: data.roomId,
        userId: user.id as string,
      },
      async (state) => {
        const socketIds = await this.eventsService.findSocketIdsByUserIds(
          state.players.map((player) => player.userId),
        );

        // Send updated state to remaining players
        this.server.to(socketIds).emit('battle:player-left', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }

  @SubscribeMessage('battle:reconnect')
  handleReconnect(
    @ConnectedSocket()
    client: Socket,
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while reconnecting`, client);
      return;
    }

    this.quizBattleService.reconnectGame(
      user.id as string,
      Date.now(),
      (state) => {
        client.emit('battle:game-start', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }

  @SubscribeMessage('battle:answer')
  handleAnswer(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      oId: string;
      qId: string;
    },
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      this.handleError(`An error occurred while submitting an answer`, client);
      return;
    }

    this.quizBattleService.answerAttempt(
      {
        roomId: data.roomId,
        userId: user.id,
        qId: data.qId,
        oId: data.oId,
      },
      async (state) => {
        const socketIds = await this.eventsService.findSocketIdsByUserIds(
          state.players.map((player) => player.userId),
        );
        this.server.to(socketIds).emit('battle:lobby-updated', state);
      },
      (errorMessage) => {
        this.handleError(errorMessage, client);
      },
    );
  }
}
