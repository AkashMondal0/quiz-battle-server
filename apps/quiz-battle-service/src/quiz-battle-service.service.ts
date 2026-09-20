import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '@app/redis';

import { CreateRoomInput } from './dto/CreateRoomDto';

import {
  BattleState,
  RoomQuestion,
  RoomSession,
  RoomSessionDetails,
  RoomSessionUser,
} from './interface/room-session.interface';

import { QuizBattleQuestionService } from './services/quiz-battle-question.service';
import { QuizBattleRankingService } from './services/quiz-battle-ranking.service';
import { PlayerGameStateService } from './services/player.game.state.service';
import Redis from 'ioredis';

@Injectable()
export class QuizBattleService {
  private readonly logger = new Logger(QuizBattleService.name);

  // Local hot cache.
  private readonly sessions = new Map<string, RoomSession>();

  private readonly reconnectGracePeriod = 10 * 60 * 1000;

  private readonly countdownSeconds = 3;

  private subscriber: Redis | null = null;

  // Track disconnect timers so we can clear them on reconnect / room expiry.
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly redisService: RedisService,
    private readonly questionService: QuizBattleQuestionService,
    private readonly rankingService: QuizBattleRankingService,
    private readonly playerGameStateService: PlayerGameStateService,
  ) {}

  async onModuleInit() {
    this.subscriber = this.redisService.client.duplicate();

    // Subscribe to expired key events from Redis DB 0.
    // Requires: redis-cli config set notify-keyspace-events Kx
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

  /**
   * Cleanup when a room's expiration marker key expires.
   * FINISHES the match (keeps final state briefly) then removes mappings.
   */
  private async handleRoomExpiration(roomId: string) {
    const session = await this.getRoom(roomId);

    if (!session) {
      this.logger.warn(`Expired room not found | room=${roomId}`);
      return;
    }

    // 1. Mark room as finished
    session.room.status = 'FINISHED';
    session.room.finishedAt = Date.now();
    session.room.currentQuestionId = undefined;
    session.room.questionStartedAt = undefined;
    session.room.questionEndsAt = undefined;

    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }

    // 2. Clear all pending disconnect timers for this room
    for (const [key, timer] of this.disconnectTimers.entries()) {
      if (key.startsWith(`${roomId}:`)) {
        clearTimeout(timer);
        this.disconnectTimers.delete(key);
      }
    }

    // 3. Final ranking update
    this.rankingService.updateRanking(session);

    // 4. Remove all players from userId -> roomId mapping
    const players = [...session.users.values()];
    await Promise.all(
      players.map((player) =>
        this.playerGameStateService.leaveGame(player.userId),
      ),
    );

    // 5. Save final state with a short TTL so clients can fetch it briefly
    await this.saveSessionToRedis(session, 5 * 60 * 1000);

    // 6. Remove from local cache
    this.sessions.delete(roomId);

    this.logger.debug(`Room finished & cleaned up | room=${roomId}`);
  }

  // ---------------------------------------------------------------------------
  // RECONNECT
  // ---------------------------------------------------------------------------

  async checkReconnectGame(
    userId: string,
    clientTime: number,
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void,
  ): Promise<void> {
    try {
      // 1. Check whether user belongs to any game
      const roomId = await this.playerGameStateService.getRoomId(userId);

      if (!roomId) {
        // onError?.('User is not part of any game');
        return;
      }

      // 2. Get room data
      const roomData = await this.getRoom(roomId);

      if (!roomData) {
        this.logger.error(
          `User ${userId} trying to reconnect to a non-existent room ${roomId}`,
        );
        await this.playerGameStateService.leaveGame(userId);
        // onError?.('Room no longer exists');
        return;
      }

      // 3. Finished room → send final state so client can show results
      if (roomData.room.status === 'FINISHED') {
        socketCallbackWithRoomState(this.createRoomState(roomData, userId));
        return;
      }

      // 4. Expired room (marker gone while PLAYING) → finalize & send
      const isExpired = await this.isRoomExpired(roomId);
      if (isExpired) {
        this.logger.warn(
          `User ${userId} reconnecting to expired room ${roomId}; finalizing`,
        );

        roomData.room.status = 'FINISHED';
        roomData.room.finishedAt = Date.now();

        if (roomData.timer) {
          clearTimeout(roomData.timer);
          roomData.timer = undefined;
        }

        this.rankingService.updateRanking(roomData);
        await this.saveSessionToRedis(roomData, 5 * 60 * 1000);
        await this.playerGameStateService.leaveGame(userId);

        socketCallbackWithRoomState(this.createRoomState(roomData, userId));
        return;
      }

      // 5. Player already answered everything → send final state, don't kick
      const player = roomData.users.get(userId);
      if (player?.allQuestionsAnswered) {
        socketCallbackWithRoomState(this.createRoomState(roomData, userId));
        return;
      }

      // 6. Normal reconnect — mark CONNECTED, clear pending disconnect timer
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

        await this.saveSessionToRedis(roomData);
      }

      socketCallbackWithRoomState(this.createRoomState(roomData, userId));
      return;
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
    clientTime: number,
    socketCallbackWithRoomState: (state: BattleState) => void,
    errorCallback: (message: string) => void,
  ) {
    try {
      const roomId = await this.playerGameStateService.getRoomId(userId);

      if (!roomId) {
        // errorCallback('User is not part of any game');
        return;
      }

      const roomData = await this.getRoom(roomId);

      if (!roomData) {
        await this.playerGameStateService.leaveGame(userId);
        errorCallback('Room no longer exists');
        return;
      }

      if (roomData.room.status === 'FINISHED') {
        socketCallbackWithRoomState(this.createRoomState(roomData, userId));
        return;
      }

      const isExpired = await this.isRoomExpired(roomId);

      if (isExpired) {
        roomData.room.status = 'FINISHED';
        roomData.room.finishedAt = Date.now();

        if (roomData.timer) {
          clearTimeout(roomData.timer);
          roomData.timer = undefined;
        }

        this.rankingService.updateRanking(roomData);
        await this.saveSessionToRedis(roomData, 5 * 60 * 1000);
        await this.playerGameStateService.leaveGame(userId);

        socketCallbackWithRoomState(this.createRoomState(roomData, userId));
        return;
      }

      const player = roomData.users.get(userId);

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

        await this.saveSessionToRedis(roomData);
      }

      socketCallbackWithRoomState(this.createRoomState(roomData, userId));
      return;
    } catch (error) {
      this.logger.error(
        `Reconnect failed | user=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      errorCallback('Failed to reconnect');
    }
  }

  // ---------------------------------------------------------------------------
  // CREATE ROOM
  // ---------------------------------------------------------------------------

  async createRoom(
    body: CreateRoomInput,
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
        profilePicture: host.profilePicture ?? null,
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

      const session: RoomSession = {
        room,
        users: new Map([[host.userId, hostUser]]),
        ranking: {
          roomId: room.roomId,
          rankings: [],
          updatedAt: now,
        },
        questions: await this.questionService.loadQuestions(10),
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

  // ---------------------------------------------------------------------------
  // GET ROOM
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // JOIN
  // ---------------------------------------------------------------------------

  async joinRoom(
    roomId: string,
    user: {
      userId: string;
      username: string;
      profilePicture?: string | null;
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

        socketCallbackWithRoomState(
          this.createRoomState(session, user.userId),
        );
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
        profilePicture: user.profilePicture ?? null,
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

  // ---------------------------------------------------------------------------
  // READY / UNREADY
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // START MATCH
  // ---------------------------------------------------------------------------

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

      const questions = await this.questionService.loadQuestions(
        session.room.numberOfQuestions,
      );

      if (!questions.length) {
        this.logger.warn('No questions available');
        onError?.('No questions available');
        return;
      }

      session.questions = questions;
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

  // ---------------------------------------------------------------------------
  // DISCONNECT
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // LEAVE
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // ANSWER
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

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
      errorEvent: null,
      errorMessage: null,
    };
  }

  // ---------------------------------------------------------------------------
  // COUNTDOWN (kept for future use)
  // ---------------------------------------------------------------------------

  async runCountdown(
    roomId: string,
    emit: (event: string, data: unknown) => void,
    onError?: (message: string) => void,
  ) {
    const session = await this.getRoom(roomId);

    if (!session) {
      onError?.('Room not found');
      return;
    }

    if (session.room.status !== 'COUNTDOWN') return;

    for (let seconds = this.countdownSeconds; seconds > 0; seconds--) {
      const current = await this.getRoom(roomId);
      if (current?.room.status !== 'COUNTDOWN') return;

      emit('battle:countdown', { seconds });
      await this.delay(1000);
    }

    const latest = await this.getRoom(roomId);
    if (!latest) {
      onError?.('Room not found');
      return;
    }

    if (latest.room.status !== 'COUNTDOWN') return;

    latest.room.status = 'PLAYING';
    latest.room.currentQuestionIndex = 0;

    await this.saveSessionToRedis(latest);

    emit('battle:started', { roomId, startedAt: Date.now() });

    await this.startCurrentQuestion(latest, emit);
  }

  // ---------------------------------------------------------------------------
  // TIMEOUT / NEXT / FINISH (kept for future use)
  // ---------------------------------------------------------------------------

  private async startCurrentQuestion(
    _session: RoomSession,
    _emit: (event: string, data: unknown) => void,
  ) {
    // Implementation intentionally left as-is (was commented out before)
  }

  private scheduleQuestionTimeout(
    session: RoomSession,
    question: RoomQuestion,
    _emit: (event: string, data: unknown) => void,
  ) {
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }

    const endsAt = session.room.questionEndsAt ?? Date.now();
    const delay = Math.max(0, endsAt - Date.now());

    // Reserved for future use
    void question;
    void delay;
  }

  private async handleQuestionTimeout(
    roomId: string,
    questionId: string,
    emit: (event: string, data: unknown) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const session = await this.getRoom(roomId);

      if (!session) {
        onError?.('Room not found');
        return;
      }

      if (session.room.status !== 'PLAYING') return;
      if (session.room.currentQuestionId !== questionId) return;

      for (const player of session.users.values()) {
        if (player.status === 'LEFT') continue;

        if (!player.answeredQuestionIds.has(questionId)) {
          player.incorrectAnswers++;
          player.answeredQuestions++;
          player.answeredQuestionIds.add(questionId);
          player.hasAnsweredCurrentQuestion = true;
        }
      }

      this.rankingService.updateRanking(session);
      await this.saveSessionToRedis(session);

      emit('battle:time_up', {
        questionId,
        endedAt: Date.now(),
        ranking: session.ranking,
      });

      await this.nextQuestion(session, emit);
    } catch (error) {
      this.logger.error(`Question timeout failed | room=${roomId}`, error);
    }
  }

  private async nextQuestion(
    session: RoomSession,
    emit: (event: string, data: unknown) => void,
  ) {
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }

    session.room.currentQuestionIndex++;

    const next = session.questions[session.room.currentQuestionIndex];

    if (!next) {
      await this.finishMatch(session, emit);
      return;
    }

    await this.saveSessionToRedis(session);

    emit('battle:next_question', {
      questionIndex: session.room.currentQuestionIndex,
    });

    await this.startCurrentQuestion(session, emit);
  }

  private async finishMatch(
    session: RoomSession,
    emit: (event: string, data: unknown) => void,
  ) {
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }

    session.room.status = 'FINISHED';
    session.room.finishedAt = Date.now();
    session.room.currentQuestionId = undefined;
    session.room.questionStartedAt = undefined;
    session.room.questionEndsAt = undefined;

    this.rankingService.updateRanking(session);

    await this.saveSessionToRedis(session);

    emit('battle:finished', {
      roomId: session.room.roomId,
      ranking: session.ranking,
      finishedAt: session.room.finishedAt,
    });
  }

  // ---------------------------------------------------------------------------
  // REMOVE EXPIRED PLAYER
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private canStartMatch(session: RoomSession): boolean {
    const players = [...session.users.values()].filter(
      (user) => user.status !== 'LEFT',
    );

    if (players.length < 2) return false;
    return players.every((user) => user.ready === true);
  }

  /**
   * A room is "expired" only if the match has actually started
   * (status PLAYING/FINISHED) AND the marker key is gone.
   * In WAITING/COUNTDOWN state, no marker exists, so it can't be "expired".
   */
  private async isRoomExpired(roomId: string): Promise<boolean> {
    const session = this.sessions.get(roomId);
    const status = session?.room.status;

    // Lobby rooms are never "expired"
    if (status === 'WAITING' || status === 'COUNTDOWN') {
      return false;
    }

    const exists = await this.redisService.client.exists(
      `game:room:${roomId}:expiration`,
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
    return [...session.users.values()].filter(
      (user) => user.status !== 'LEFT',
    ).length;
  }

  private calculatePoints(
    session: RoomSession,
    question: RoomQuestion,
    correct: boolean,
  ): number {
    if (!correct) return 0;

    const base = 100;
    const startedAt = session.room.questionStartedAt ?? Date.now();
    const endsAt = session.room.questionEndsAt ?? Date.now();
    const remaining = Math.max(0, endsAt - Date.now());
    const total = Math.max(1, endsAt - startedAt);
    const speedRatio = remaining / total;
    const speedBonus = Math.floor(speedRatio * 50);

    // Keep param referenced (question unused for now)
    void question;

    return base + speedBonus;
  }

  private serializePublicUser(user: RoomSessionUser) {
    return {
      userId: user.userId,
      username: user.username,
      profilePicture: user.profilePicture ?? null,
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

  private serializePrivateUser(user: RoomSessionUser) {
    return {
      ...this.serializePublicUser(user),
      incorrectAnswers: user.incorrectAnswers,
    };
  }

  // ---------------------------------------------------------------------------
  // REDIS
  // ---------------------------------------------------------------------------

  private async saveSessionToRedis(
    session: RoomSession,
    ttlOverrideMs?: number,
  ) {
    const data = {
      room: session.room,
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
      ttlOverrideMs ??
      (session.room.totalTimeSeconds ?? 600) * 1000 + 60_000;

    await this.redisService.client.set(
      key,
      JSON.stringify(data),
      'PX',
      ttlMs,
    );
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
      };
    } catch (error) {
      this.logger.error(`Failed to restore room ${roomId}`, error);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // IDS
  // ---------------------------------------------------------------------------

  private generateRoomCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}