import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@app/redis';
import {
  BattleState,
  RoomSession,
  RoomSessionDetails,
  RoomSessionUser,
  SocketUser,
} from './interface/room-session.interface';
import { QuizBattleQuestionService } from './services/quiz-battle-question.service';
import { QuizBattleRankingService } from './services/quiz-battle-ranking.service';
import { PlayerGameStateService } from './services/player.game.state.service';
import Redis from 'ioredis';
import { BattleMessageDto } from './interface/battle.dto';
import { EventsService } from './events/events.service';
import { _Questions } from './services/_Questions';

@Injectable()
export class QuizBattleService {
 private readonly logger = new Logger(QuizBattleService.name);

  // Local hot cache.
  private readonly sessions = new Map<string, RoomSession>();

  private readonly reconnectGracePeriod = 10 * 60 * 1000;

  private subscriber: Redis | null = null;

  // Track disconnect timers so we can clear them on reconnect / room expiry.
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly redisService: RedisService,
    private readonly questionService: QuizBattleQuestionService,
    private readonly rankingService: QuizBattleRankingService,
    private readonly playerGameStateService: PlayerGameStateService,
    private readonly eventsService: EventsService,
  ) {}

  async onModuleInit() {
    this.subscriber = this.redisService.client.duplicate();

    this.subscriber.on('error', (err) => {
      this.logger.error(
        'Redis subscriber error',
        err instanceof Error ? err.stack : String(err),
      );
    });

    try {
      await (this.redisService.client as any).config(
        'SET',
        'notify-keyspace-events',
        'Ex',
      );
    } catch (error) {
      this.logger.warn(
        'Could not set notify-keyspace-events on Redis (may be disabled for managed/cluster instances). ' +
          'Ensure it is configured out of band: CONFIG SET notify-keyspace-events Ex',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // Subscribe to expired key events from Redis DB 0.
    await this.subscriber.psubscribe('__keyevent@0__:expired');

    this.subscriber.on(
      'pmessage',
      async (_pattern: string, _channel: string, key: string) => {
        const match = key.match(/^game:room:(.+):expiration$/);
        if (!match) return;

        const roomId = match[1];

        try {
          await this.handleRoomExpiration(roomId);
        } catch (error) {
          this.logger.error(
            `Failed to handle room expiration | room=${roomId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      },
    );
  }

  async onModuleDestroy() {
    if (!this.subscriber) return;
    await this.subscriber.punsubscribe('__keyevent@0__:expired');
    await this.subscriber.quit();
  }

  // Cleanup when a room's expiration marker key expires.
  // FINISHES the match (keeps final state briefly) then removes mappings.
  private async handleRoomExpiration(roomId: string) {
    const session = await this.getRoom(roomId);

    if (!session) {
      this.logger.warn(`Expired room not found | room=${roomId}`);
      return;
    }

    if (session.room.status === 'FINISHED') {
      this.sessions.delete(roomId);
      return;
    }

    await this.finishMatch(session);

    // Clear all pending disconnect timers for this room
    for (const [key, timer] of this.disconnectTimers.entries()) {
      if (key.startsWith(`${roomId}:`)) {
        clearTimeout(timer);
        this.disconnectTimers.delete(key);
      }
    }

    // Remove from local cache
    this.sessions.delete(roomId);

    this.logger.debug(`Room finished & cleaned up | room=${roomId}`);
  }

  // DISCONNECT (socket-level) — called by the gateway's handleDisconnect.
  // This was previously never invoked anywhere, so a dropped connection
  // never reached QuizBattleService at all: no grace-period timer started,
  // and other players in the room never learned anyone left.
  async handleSocketDisconnect(userId: string): Promise<void> {
    try {
      const roomId = await this.playerGameStateService.getRoomId(userId);
      if (!roomId) return;

      const session = await this.getRoom(roomId);
      if (!session) return;

      if (session.room.status === 'FINISHED') return;

      const publicUser = await this.disconnectUser(roomId, userId);
      if (!publicUser) return;

      const state = this.createRoomState(session);
      const remainingUserIds = [...session.users.values()]
        .filter((u) => u.userId !== userId && u.status !== 'LEFT')
        .map((u) => u.userId);

      await this.broadcastToRoom(
        remainingUserIds,
        'battle:player-disconnected',
        state,
      );
    } catch (error) {
      this.logger.error(
        `Error handling socket disconnect | user=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // RECONNECT
  async checkReconnectGame(
    userId: string,
    _clientTime: number,
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ): Promise<void> {
    try {
      const state = await this.getReconnectState(userId);
      if (state) {
        socketCallbackWithRoomState(state);
      }
    } catch (error) {
      this.logger.error(
        `Reconnect check failed | user=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('Failed to check reconnect state');
    }
  }

  async reconnectGame(
    userId: string,
    _clientTime: number,
    socketCallbackWithRoomState: (state: BattleState) => void,
    errorCallback: (message: string) => void,
  ) {
    try {
      const roomId = await this.playerGameStateService.getRoomId(userId);

      if (!roomId) {
        errorCallback('User is not part of any game');
        return;
      }

      const state = await this.getReconnectState(userId);

      if (!state) {
        errorCallback('Room no longer exists');
        return;
      }

      socketCallbackWithRoomState(state);
    } catch (error) {
      this.logger.error(
        `Reconnect failed | user=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      errorCallback('Failed to reconnect');
    }
  }

  // Shared resolution logic for both reconnect paths above. This used to be
  // duplicated almost verbatim across checkReconnectGame/reconnectGame,
  // which is exactly the kind of place duplicated logic quietly drifts out
  // of sync and grows subtle bugs.
  private async getReconnectState(userId: string): Promise<BattleState | null> {
    const roomId = await this.playerGameStateService.getRoomId(userId);
    if (!roomId) return null;

    const session = await this.getRoom(roomId);

    if (!session) {
      this.logger.error(
        `User ${userId} trying to reconnect to a non-existent room ${roomId}`,
      );
      await this.playerGameStateService.leaveGame(userId);
      return null;
    }

    if (session.room.status === 'FINISHED') {
      return this.createRoomState(session, userId);
    }

    if (await this.isRoomExpired(session)) {
      this.logger.warn(
        `User ${userId} reconnecting to expired room ${roomId}; finalizing`,
      );
      await this.finishMatch(session);
      return this.createRoomState(session, userId);
    }

    const player = session.users.get(userId);

    if (player?.allQuestionsAnswered) {
      return this.createRoomState(session, userId);
    }

    if (player) {
      player.status = 'CONNECTED';
      player.lastSeenAt = Date.now();
      player.disconnectedAt = undefined;

      const timerKey = `${roomId}:${userId}`;
      const pending = this.disconnectTimers.get(timerKey);
      if (pending) {
        clearTimeout(pending);
        this.disconnectTimers.delete(timerKey);
      }

      await this.saveSessionToRedis(session);
    }

    return this.createRoomState(session, userId);
  }

  // CREATE ROOM
  async createRoom(
    body: {
      host: {
        userId: string;
        username: string;
        avatar?: string | null;
        avatarId?: string | null;
      };
      topic: string;
      prompt?: string;
      aiId: string;
      mode: string;
      difficulty: string;
      visibility: string;
      maxPlayers: number;
      numberOfQuestions: number;
      totalTimeSeconds: number;
    },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const host = body.host;
      const roomCode = this.generateRoomCode();
      const now = Date.now();

      const room: RoomSessionDetails = {
        roomId: roomCode,
        roomCode,
        hostId: host.userId,
        topic: body.topic,
        prompt: body.prompt ?? '',
        aiId: body.aiId,
        mode: body.mode,
        difficulty: body.difficulty,
        visibility: body.visibility,
        maxPlayers: body.maxPlayers,
        numberOfQuestions: body.numberOfQuestions,
        totalTimeSeconds: body.totalTimeSeconds,
        status: 'WAITING',
        currentQuestionIndex: -1,
        createdAt: now,
      };

      const hostUser: RoomSessionUser = {
        userId: host.userId,
        username: host.username,
        avatar: host.avatar ?? null,
        avatarId: host.avatarId ?? null,
        status: 'CONNECTED',
        ready: false,
        joinedAt: now,
        lastSeenAt: now,
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        answeredQuestions: 0,
        rank: 1,
        hasAnsweredCurrentQuestion: false,
        answeredQuestionIds: new Set<string>(),
        allQuestionsAnswered: false,
      };

      // const questions = await this.questionService.generateQuestions({
      //   topic: room.topic,

      //   difficulty: room.difficulty,

      //   numberOfQuestions: room.numberOfQuestions,

      //   prompt: room.prompt,

      //   mode: room.mode,
      // });

      const questions = _Questions

      if (!questions.length) {
        this.logger.warn('No questions generated for the room');
        onError?.(
          'No questions available for the selected topic and difficulty',
        );
        return;
      }

      const session: RoomSession = {
        room,
        users: new Map([[host.userId, hostUser]]),
        ranking: {
          roomId: room.roomId,
          rankings: [],
          updatedAt: now,
        },
        questions: questions,
        messages: [],
      };

      this.rankingService.updateRanking(session);
      this.sessions.set(session.room.roomId, session);

      await this.saveSessionToRedis(session);

      const state = this.createRoomState(session, host.userId);

      await this.playerGameStateService.enterGame(host.userId, roomCode);

      socketCallbackWithRoomState(state);
      return;
    } catch (error) {
      this.logger.error(
        'Error creating room',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('An error occurred while creating the room');
    }
  }

  async getRoomData(roomId: string): Promise<BattleState | null> {
    const session = await this.getRoom(roomId);
    if (!session) return null;
    return this.createRoomState(session);
  }

  // GET ROOM
  async getRoom(
    roomId: string,
    onError?: (message: string) => void,
  ): Promise<RoomSession | null> {
    const normalized = roomId?.trim();

    if (!normalized) {
      this.logger.warn('Room id is required');
      onError?.('Room id is required');
      return null;
    }

    const local = this.sessions.get(normalized);
    if (local) return local;

    const restored = await this.loadSessionFromRedis(normalized);

    if (!restored) {
      this.logger.warn(`Room not found | room=${normalized}`);
      onError?.('Room not found');
      return null;
    }

    this.sessions.set(normalized, restored);
    return restored;
  }

  // JOIN
  async joinRoom(
    roomId: string,
    user: {
      userId: string;
      username: string;
      avatar?: string | null;
      avatarId?: string | null;
    },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const session = await this.getRoom(roomId);

      if (!session) {
        onError?.('Room not found');
        return;
      }

      // Existing player → treat as reconnect
      const existing = session.users.get(user.userId);

      if (existing) {
        if (existing.status === 'LEFT') {
          onError?.('You have left this match');
          return;
        }

        existing.status = 'CONNECTED';
        existing.lastSeenAt = Date.now();
        existing.disconnectedAt = undefined;

        // Clear pending disconnect timer
        const timerKey = `${roomId}:${user.userId}`;
        const pending = this.disconnectTimers.get(timerKey);
        if (pending) {
          clearTimeout(pending);
          this.disconnectTimers.delete(timerKey);
        }

        await this.saveSessionToRedis(session);
        await this.playerGameStateService.enterGame(user.userId, roomId);

        socketCallbackWithRoomState(this.createRoomState(session, user.userId));
        return;
      }

      if (session.room.status !== 'WAITING') {
        onError?.('Game has already started');
        return;
      }

      const playerCount = this.getActivePlayerCount(session);

      if (playerCount >= session.room.maxPlayers) {
        onError?.('Room is full');
        return;
      }

      const now = Date.now();

      const newUser: RoomSessionUser = {
        userId: user.userId,
        username: user.username,
        avatar: user.avatar ?? null,
        avatarId: user.avatarId ?? null,
        status: 'CONNECTED',
        ready: false,
        joinedAt: now,
        lastSeenAt: now,
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        answeredQuestions: 0,
        rank: playerCount + 1,
        hasAnsweredCurrentQuestion: false,
        answeredQuestionIds: new Set<string>(),
        allQuestionsAnswered: false,
      };

      session.users.set(user.userId, newUser);
      this.rankingService.updateRanking(session);

      await this.saveSessionToRedis(session);

      socketCallbackWithRoomState(this.createRoomState(session, user.userId));

      await this.playerGameStateService.enterGame(user.userId, roomId);
      return;
    } catch (error) {
      this.logger.error(
        'Error joining room',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('An error occurred while joining the room');
    }
  }

  // READY / UNREADY
  async setPlayerReady(
    {
      roomId,
      userId,
      ready,
    }: { roomId: string; userId: string; ready: boolean },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    const session = await this.getRoom(roomId);

    if (!session) {
      onError?.('Room not found');
      return;
    }

    if (session.room.status !== 'WAITING') {
      onError?.('Ready state cannot be changed now');
      return;
    }

    const user = session.users.get(userId);

    if (!user) {
      onError?.('Player not found');
      return;
    }

    if (user.status === 'LEFT') {
      onError?.('Player has left the room');
      return;
    }

    user.ready = ready;
    user.lastSeenAt = Date.now();

    await this.saveSessionToRedis(session);

    socketCallbackWithRoomState(this.createRoomState(session, userId));
    return;
  }

  // START MATCH
  async startMatch(
    { roomId, userId }: { roomId: string; userId: string },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const session = await this.getRoom(roomId);

      if (!session) {
        onError?.('Room not found');
        return;
      }

      if (session.room.hostId !== userId) {
        this.logger.warn('Only the host can start the match');
        onError?.('Only the host can start the match');
        return;
      }

      if (session.room.status !== 'WAITING') {
        this.logger.warn('Match cannot be started now');
        onError?.('Match cannot be started now');
        return;
      }

      if (!session.questions.length) {
        this.logger.warn('No questions available');
        onError?.('No questions available');
        return;
      }

      session.questions = session.questions;
      session.room.status = 'PLAYING';
      session.room.currentQuestionIndex = -1;
      session.room.matchStartedAt = Date.now();
      session.room.currentQuestionId = undefined;
      session.room.questionStartedAt = undefined;
      session.room.questionEndsAt = undefined;

      for (const player of session.users.values()) {
        player.hasAnsweredCurrentQuestion = false;
      }

      await this.saveSessionToRedis(session);

      // Set expiration marker (NX → won't reset if already set)
      const durationMs = (session.room.totalTimeSeconds || 600) * 1000;
      await this.playerGameStateService.startGame(roomId, durationMs);

      socketCallbackWithRoomState(this.createRoomState(session, userId));
      return;
    } catch (error) {
      this.logger.error(
        'Error starting room',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('Failed to start match');
      return;
    }
  }

  // DISCONNECT
  async disconnectUser(
    roomId: string,
    userId: string,
    onError?: (message: string) => void,
  ) {
    const session = await this.getRoom(roomId);

    if (!session) {
      onError?.('Room not found');
      this.logger.warn(`Room not found | room=${roomId}`);
      return null;
    }

    const user = session.users.get(userId);

    if (!user) return null;

    user.status = 'DISCONNECTED';
    user.disconnectedAt = Date.now();
    user.lastSeenAt = Date.now();

    await this.saveSessionToRedis(session);

    // Clear any existing timer for this player (avoid duplicates)
    const timerKey = `${roomId}:${userId}`;
    const existing = this.disconnectTimers.get(timerKey);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      void this.removeExpiredPlayer(roomId, userId);
    }, this.reconnectGracePeriod);

    // Don't block process exit
    if (typeof timer.unref === 'function') timer.unref();

    this.disconnectTimers.set(timerKey, timer);

    return this.serializePublicUser(user);
  }

  // LEAVE
  async leaveRoom(
    { roomId, userId }: { roomId: string; userId: string },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const session = await this.getRoom(roomId);

      if (!session) {
        onError?.('Room not found');
        return;
      }

      const user = session.users.get(userId);

      if (!user) {
        onError?.('Player not found');
        return;
      }

      // Clear any pending disconnect timer
      const timerKey = `${roomId}:${userId}`;
      const pending = this.disconnectTimers.get(timerKey);
      if (pending) {
        clearTimeout(pending);
        this.disconnectTimers.delete(timerKey);
      }

      session.users.delete(userId);

      this.rankingService.updateRanking(session);

      await this.saveSessionToRedis(session);

      await this.playerGameStateService.leaveGame(userId);

      const state = this.createRoomState(session);

      socketCallbackWithRoomState(state);
      return;
    } catch (error) {
      this.logger.error(
        'Error leaving room',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('An error occurred while leaving the room');
    }
  }
  async postMessage(
    data: BattleMessageDto & SocketUser,
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ): Promise<void> {
    try {
      const session = await this.getRoom(data.roomId);
      if (!session) {
        onError?.('Room not found');
        return;
      }

      // Add the message to the session
      session.messages.push({
        id: `message_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: data.id,
        username: data.username,
        avatar: data.avatar ?? null,
        avatarId: data.avatarId ?? null,
        message: data.message,
        emoji: data.emoji,
        system: data.system,
        systemMessage: data.systemMessage,
        timestamp: Date.now(),
      });

      await this.saveSessionToRedis(session);

      socketCallbackWithRoomState(this.createRoomState(session, data.id));
    } catch (error) {
      this.logger.error(
        'Error posting message',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('Failed to post message');
    }
  }

  // ANSWER
  async answerAttempt(
    {
      roomId,
      userId,
      qId,
      oId,
    }: {
      roomId: string;
      userId: string;
      qId: string;
      oId: string;
    },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ) {
    try {
      // 1. Get room
      const session = await this.getRoom(roomId);

      if (!session) {
        onError?.('Room not found');
        return;
      }

      // 2. Get player
      const user = session.users.get(userId);

      if (!user) {
        onError?.('Player not found');
        return;
      }

      // 3. Player must not have left
      if (user.status === 'LEFT') {
        onError?.('Player has left the match');
        return;
      }

      // 4. Game must be playing
      if (session.room.status !== 'PLAYING') {
        onError?.('Game is not currently playing');
        return;
      }

      // 5. Verify this is a valid question
      const sessionLength = session.questions.length;
      const questionIndex = session.questions.findIndex(
        (item) => item.id === qId,
      );

      if (questionIndex === -1) {
        onError?.('This question is no longer active');
        return;
      }

      // 6. Question timeout check
      if (
        session.room.questionEndsAt &&
        Date.now() >= session.room.questionEndsAt
      ) {
        onError?.('Time is over');
        return;
      }

      // 7. Prevent duplicate answer
      if (user.answeredQuestionIds.has(qId)) {
        onError?.('Question already answered');
        return;
      }

      // 8. Find question
      const question = session.questions[questionIndex];

      if (!question) {
        onError?.('Question not found');
        return;
      }

      // 9. Validate selected option
      const selectedOption = question.options?.find(
        (option) => option.id === oId,
      );

      if (!selectedOption) {
        onError?.('Invalid answer');
        return;
      }

      // 10. Check answer
      const correct = question.correctOptionId === oId;

      // 11. Calculate points
      const points = correct ? Math.max(0, question.points ?? 0) : 0;

      // 12. Mark question as answered
      user.answeredQuestionIds.add(qId);
      user.hasAnsweredCurrentQuestion = true;
      user.answeredQuestions++;

      // ✅ FIXED: compare answered set size to total questions
      user.allQuestionsAnswered =
        user.answeredQuestionIds.size >= sessionLength;

      if (user.allQuestionsAnswered) {
        await this.playerGameStateService.leaveGame(userId);
      }

      // 13. Update player statistics
      if (correct) {
        user.correctAnswers++;
        user.score += points;
      } else {
        user.incorrectAnswers++;
      }

      user.lastSeenAt = Date.now();

      // 14. Update ranking
      this.rankingService.updateRanking(session);

      // 15. Save updated state
      await this.saveSessionToRedis(session);

      // 16. Send updated BattleState
      socketCallbackWithRoomState(this.createRoomState(session, userId));
      return;
    } catch (error) {
      this.logger.error(
        'Error answering question',
        error instanceof Error ? error.stack : String(error),
      );
      onError?.('An error occurred while submitting an answer');
    }
  }

  // STATE
  private createRoomState(session: RoomSession, userId?: string): BattleState {
    const currentQuestion =
      session.questions[session.room.currentQuestionIndex] ?? null;

    const currentUser = userId ? session.users.get(userId) : undefined;

    const timerSeconds = session.room.questionEndsAt
      ? Math.max(
          0,
          Math.ceil((session.room.questionEndsAt - Date.now()) / 1000),
        )
      : 0;

    const players = [...session.users.values()];

    return {
      phase:
        session.room.status === 'WAITING'
          ? 'LOBBY'
          : session.room.status === 'FINISHED'
            ? 'FINISHED'
            : 'QUESTION',

      room: session.room,
      players,
      allReady: this.areAllPlayersReady(session),
      currentQuestion,
      questionIndex: session.room.currentQuestionIndex,
      totalQuestions: session.questions.length,
      timerSeconds,
      selectedOptionId: null,
      hasAnsweredCurrent: currentUser?.hasAnsweredCurrentQuestion ?? false,
      lastAnswerCorrect: null,
      lastPointsEarned: 0,
      rankings: session.ranking.rankings,
      questions: session.questions,
      messages: session.messages,
      errorEvent: null,
      errorMessage: null,
    };
  }

  // REMOVE EXPIRED PLAYER
  private async removeExpiredPlayer(roomId: string, userId: string) {
    const session = this.sessions.get(roomId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    if (user.status !== 'DISCONNECTED') return;

    const disconnectedAt = user.disconnectedAt ?? 0;
    if (Date.now() - disconnectedAt < this.reconnectGracePeriod) return;

    user.status = 'LEFT';
    user.ready = false;

    this.rankingService.updateRanking(session);
    await this.saveSessionToRedis(session);
  }

private async isRoomExpired(session: RoomSession): Promise<boolean> {
    const status = session.room.status;

    // Lobby rooms are never "expired"
    if (status === 'WAITING' || status === 'COUNTDOWN') {
      return false;
    }

    const exists = await this.redisService.client.exists(
      `game:room:${session.room.roomId}:expiration`,
    );

    return exists === 0;
  }

  private areAllPlayersReady(session: RoomSession): boolean {
    const players = [...session.users.values()].filter(
      (user) => user.status !== 'LEFT',
    );

    if (players.length === 0) return false;
    return players.every((user) => user.ready);
  }

  private getActivePlayerCount(session: RoomSession): number {
    return [...session.users.values()].filter((user) => user.status !== 'LEFT')
      .length;
  }

  private serializePublicUser(user: RoomSessionUser) {
    return {
      userId: user.userId,
      username: user.username,
      avatar: user.avatar ?? null,
      avatarId: user.avatarId,
      status: user.status,
      ready: user.ready,
      joinedAt: user.joinedAt,
      score: user.score,
      correctAnswers: user.correctAnswers,
      answeredQuestions: user.answeredQuestions,
      rank: user.rank,
      hasAnsweredCurrentQuestion: user.hasAnsweredCurrentQuestion,
    };
  }

  // REDIS
  private async saveSessionToRedis(
    session: RoomSession,
    ttlOverrideMs?: number,
  ) {
    const data = {
      room: session.room,
      messages: session.messages,
      users: [...session.users.values()].map((user) => ({
        ...user,
        answeredQuestionIds: [...user.answeredQuestionIds],
      })),
      ranking: session.ranking,
      questions: session.questions,
      updatedAt: Date.now(),
    };

    const key = `quiz:battle:room:${session.room.roomId}`;

    const ttlMs =
      ttlOverrideMs ?? (session.room.totalTimeSeconds ?? 600) * 1000 + 60_000;

    await this.redisService.client.set(key, JSON.stringify(data), 'PX', ttlMs);
  }

  private async loadSessionFromRedis(
    roomId: string,
  ): Promise<RoomSession | null> {
    const data = await this.redisService.client.get(
      `quiz:battle:room:${roomId}`,
    );

    if (!data) return null;

    try {
      const parsed = JSON.parse(data.toString());

      const users = new Map<string, RoomSessionUser>();

      for (const user of parsed.users ?? []) {
        users.set(user.userId, {
          ...user,
          ready: user.ready ?? false,
          answeredQuestionIds: new Set(user.answeredQuestionIds ?? []),
        });
      }

      return {
        room: parsed.room,
        users,
        ranking: parsed.ranking ?? {
          roomId,
          rankings: [],
          updatedAt: Date.now(),
        },
        questions: parsed.questions ?? [],
        messages: parsed.messages ?? [],
      };
    } catch (error) {
      this.logger.error(`Failed to restore room ${roomId}`, error);
      return null;
    }
  }

  // IDS
  private generateRoomCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
  }

  private async finishMatch(session: RoomSession): Promise<void> {
    if (session.room.status === 'FINISHED') return;

    session.room.status = 'FINISHED';
    session.room.finishedAt = Date.now();
    session.room.currentQuestionId = undefined;
    session.room.questionStartedAt = undefined;
    session.room.questionEndsAt = undefined;

    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }

    this.rankingService.updateRanking(session);
    await this.saveSessionToRedis(session, 5 * 60 * 1000);

    const players = [...session.users.values()];
    await Promise.all(
      players.map((player) =>
        this.playerGameStateService.leaveGame(player.userId),
      ),
    );

    const userIds = players.map((p) => p.userId);
    await this.broadcastToRoom(
      userIds,
      'battle:finished',
      this.createRoomState(session),
    );
  }

   private async broadcastToRoom(
    userIds: string[],
    event: string,
    payload: unknown,
  ): Promise<void> {
    if (!userIds.length) return;
    await this.eventsService.emitToUsers(userIds, event, payload);
  }
}
