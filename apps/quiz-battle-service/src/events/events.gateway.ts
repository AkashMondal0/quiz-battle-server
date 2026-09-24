import {
  Ack,
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
import { AckResponse } from '../interface/room-session.interface';
import {
  AnswerDto,
  CreateRoomDto,
  JoinRoomDto,
  ReadyDto,
  RoomIdDto,
} from '../interface/battle.dto';

@WebSocketGateway({
  namespace: '/event',

  cors: {
    origin: true,
    credentials: true,
  },

  transports: ['websocket'],

  // Tighter heartbeat/connect tuning to reduce false "disconnected" reads
  // and surface dead connections faster instead of hanging.
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 15000,
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

    const rootServer: any = (server as any).server ?? server;
    const engine = rootServer?.engine;

    if (engine?.on) {
      engine.on('connection_error', (err: any) => {
        this.logger.warn(
          `WebSocket connection error | code=${err?.code} message=${err?.message} context=${JSON.stringify(
            err?.context ?? {},
          )}`,
        );
      });
    } else {
      this.logger.warn(
        'Could not attach engine.io connection_error listener (engine not found on server instance)',
      );
    }

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

    // Defensive per-socket error logging - an unhandled 'error' event on a
    // socket can otherwise be swallowed and just looks like a silent drop.
    client.on('error', (err) => {
      this.logger.warn(
        `Socket error | socket=${client.id} | ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    try {
      const user = this.eventsService.extractUserFromSocket(client);

      if (!user) {
        await this.handleError(
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

    // IMPORTANT: extract the user BEFORE unregistering, and BEFORE the
    // registry cleanup can race with a reconnect on another socket.
    const user = this.eventsService.extractUserFromSocket(client);

    await this.eventsService.unregisterSocket(client);

    if (!user) return;

    await this.quizBattleService.handleSocketDisconnect(user.id);
  }

  @SubscribeMessage('battle:create')
  handleCreateRoom(
    @ConnectedSocket()
    client: Socket,

    @Ack()
    ack: (response: AckResponse) => void,

    @MessageBody()
    data: CreateRoomDto,
  ) {
    const user = this.eventsService.extractUserFromSocket(client);

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      ack({
        success: false,
        status: 'NOT_FOUND',
        message: 'An error occurred while creating the room',
        requestId: data.requestId,
        serverTime: Date.now(),
      });
      return;
    }

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
        client.emit('battle:lobby', state);
        ack({
          success: true,
          status: 'CREATED',
          message: 'Room created successfully',
          requestId: data.requestId,
          serverTime: Date.now(),
        });
      },
      (errorMessage) => {
        ack({
          success: false,
          status: 'SERVER_ERROR',
          message: errorMessage,
          requestId: data.requestId,
          serverTime: Date.now(),
        });
      },
    );
  }

  @SubscribeMessage('battle:join')
  handleJoinRoom(
    @ConnectedSocket()
    client: Socket,

    @Ack()
    ack: (response: AckResponse) => void,

    @MessageBody()
    data: JoinRoomDto,
  ) {
    const user = this.eventsService.extractUserFromSocket(client);
    // Fixed: this was previously `requestId: data.roomId` - the ack's
    // requestId field was silently being filled with the room id because
    // the join payload never actually carried a requestId.
    const requestId = data.requestId ?? this.eventsService.generateRequestId();

    if (!user) {
      this.logger.warn(`Invalid user information for client: ${client.id}`);
      // this.handleError(`An error occurred while joining the room`, client);
      ack({
        success: false,
        status: 'NOT_FOUND',
        message: 'An error occurred while joining the room',
        requestId: requestId,
        serverTime: Date.now(),
      });
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
        ack({
          success: true,
          status: 'OK',
          message: 'Joined room successfully',
          requestId: requestId,
          serverTime: Date.now(),
        });
      },
      (errorMessage) => {
        // this.handleError(errorMessage, client);
        ack({
          success: false,
          status: 'SERVER_ERROR',
          message: errorMessage,
          requestId: requestId,
          serverTime: Date.now(),
        });
      },
    );
  }

  @SubscribeMessage('battle:ready')
  handleReady(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: ReadyDto,
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
    data: RoomIdDto,
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
    data: RoomIdDto,
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
    data: AnswerDto,
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
