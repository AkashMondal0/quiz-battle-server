import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { RedisService } from '@app/redis';

import {
  CreateRoomInput,
} from './dto/CreateRoomDto';

import {
  BattleState,
  RoomQuestion,
  RoomSession,
  RoomSessionDetails,
  RoomSessionUser,
} from './interface/room-session.interface';

import {
  QuizBattleQuestionService,
} from './quiz-battle-question.service';

import {
  QuizBattleRankingService,
} from './quiz-battle-ranking.service';

@Injectable()
export class QuizBattleService {
  private readonly logger =
    new Logger(
      QuizBattleService.name,
    );

  /**
   * Local hot cache.
   */
  private readonly sessions =
    new Map<string, RoomSession>();

  private readonly reconnectGracePeriod =
    10 * 60 * 1000;

  private readonly countdownSeconds =
    3;

  constructor(
    private readonly redisService:
      RedisService,

    private readonly questionService:
      QuizBattleQuestionService,

    private readonly rankingService:
      QuizBattleRankingService,
  ) { }

  // ============================================================
  // CREATE ROOM
  // ============================================================

  async createRoom(
    body: CreateRoomInput,
    socketCallbackWithRoomState: (
      state: unknown,
    ) => void,
    onError?: (message: string) => void,
  ) {
    try {
      const host =
        body.host;

      const roomCode =
        this.generateRoomCode();

      const now =
        Date.now();

      const room:
        RoomSessionDetails = {
        roomId: roomCode,

        roomCode,

        hostId:
          host.userId,

        topic:
          body.topic,

        prompt:
          body.prompt ?? '',

        aiId:
          body.aiId,

        mode:
          body.mode,

        difficulty:
          body.difficulty,

        visibility:
          body.visibility,

        maxPlayers:
          body.maxPlayers,

        numberOfQuestions:
          body.numberOfQuestions,

        totalTimeSeconds:
          body.totalTimeSeconds,

        status:
          'WAITING',

        currentQuestionIndex:
          -1,

        createdAt:
          now,
      };

      const hostUser:
        RoomSessionUser = {
        userId:
          host.userId,

        username:
          host.username,

        profilePicture:
          host.profilePicture ?? null,

        avatarId:
          host.avatarId ?? null,

        status:
          'CONNECTED',

        ready:
          false,

        joinedAt:
          now,

        lastSeenAt:
          now,

        score:
          0,

        correctAnswers:
          0,

        incorrectAnswers:
          0,

        answeredQuestions:
          0,

        rank:
          1,

        hasAnsweredCurrentQuestion:
          false,

        answeredQuestionIds:
          new Set<string>(),
      };

      const session:
        RoomSession = {
        room,

        users:
          new Map([
            [
              host.userId,
              hostUser,
            ],
          ]),

        ranking: {
          roomId: room.roomId,

          rankings: [],

          updatedAt:
            now,
        },

        questions: [],
      };

      this.rankingService
        .updateRanking(
          session,
        );

      this.sessions.set(
        session.room.roomId,
        session,
      );

      await this.saveSessionToRedis(
        session,
      );

      const state = this.createRoomState(
        session,
        host.userId,
      );

      socketCallbackWithRoomState(state);
      return;
    } catch (error) {
      this.logger.error(
        'Error creating room',
        error instanceof Error
          ? error.stack
          : String(error),
      );
      onError?.('An error occurred while creating the room');
    }
  }

  // ============================================================
  // GET ROOM
  // ============================================================

  async getRoom(
    roomId: string,
  ): Promise<RoomSession> {
    const normalized =
      roomId?.trim();

    if (!normalized) {
      throw new NotFoundException(
        'Room id is required',
      );
    }

    const local =
      this.sessions.get(
        normalized,
      );

    if (local) {
      return local;
    }

    const restored =
      await this.loadSessionFromRedis(
        normalized,
      );

    if (!restored) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    this.sessions.set(
      normalized,
      restored,
    );

    return restored;
  }

  // ============================================================
  // JOIN
  // ============================================================

  async joinRoom(
    roomId: string,
    user: {
      userId: string;
      username: string;
      profilePicture?: string | null;
      avatarId?: string | null;
    },
    socketCallbackWithRoomState: (
      state: BattleState,
    ) => void,
    onError?: (message: string) => void
  ) {
    try {
      const session =
        await this.getRoom(roomId);

      const existing =
        session.users.get(
          user.userId,
        );

      if (existing) {
        if (
          existing.status ===
          'LEFT'
        ) {
          onError?.('You have left this match');
          return;
        }

        existing.status =
          'CONNECTED';

        existing.lastSeenAt =
          Date.now();

        existing.disconnectedAt =
          undefined;

        await this.saveSessionToRedis(
          session,
        );

        socketCallbackWithRoomState(
          this.createRoomState(
            session,
            user.userId,
          ),
        );
      }

      if (
        session.room.status !==
        'WAITING'
      ) {
        onError?.('Game has already started');
        return;
      }

      const playerCount =
        this.getActivePlayerCount(
          session,
        );

      if (
        playerCount >=
        session.room.maxPlayers
      ) {
        onError?.('Room is full');
        return;
      }

      const now =
        Date.now();

      const newUser:
        RoomSessionUser = {
        userId:
          user.userId,

        username:
          user.username,

        profilePicture:
          user.profilePicture ?? null,

        avatarId:
          user.avatarId ?? null,

        status:
          'CONNECTED',

        ready:
          false,

        joinedAt:
          now,

        lastSeenAt:
          now,

        score:
          0,

        correctAnswers:
          0,

        incorrectAnswers:
          0,

        answeredQuestions:
          0,

        rank:
          playerCount + 1,

        hasAnsweredCurrentQuestion:
          false,

        answeredQuestionIds:
          new Set<string>(),
      };

      session.users.set(
        user.userId,
        newUser,
      );

      this.rankingService
        .updateRanking(
          session,
        );

      await this.saveSessionToRedis(
        session,
      );

      socketCallbackWithRoomState(
        this.createRoomState(
          session,
          user.userId,
        ),
      );
      return;
    } catch (error) {
          this.logger.error(
        'Error joining room',
        error instanceof Error
          ? error.stack
          : String(error),
      );
      onError?.('An error occurred while joining the room');
    }
  }

  // ============================================================
  // READY / UNREADY
  // ============================================================

  async setPlayerReady(
    { roomId, userId, ready }: { roomId: string; userId: string; ready: boolean },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void
  ) {
    const session =
      await this.getRoom(
        roomId,
      );

    if (
      session.room.status !==
      'WAITING'
    ) {
      onError?.('Ready state cannot be changed now');
    }

    const user =
      session.users.get(
        userId,
      );

    if (!user) {
      onError?.('Player not found');
      return;
    }

    if (
      user.status ===
      'LEFT'
    ) {
      onError?.('Player has left the room');
      return;
    }

    user.ready =
      ready;

    user.lastSeenAt =
      Date.now();

    await this.saveSessionToRedis(
      session,
    );

    socketCallbackWithRoomState(
      this.createRoomState(
        session,
        userId,
      ),
    );
    return;
  }

  // ============================================================
  // START MATCH
  // ============================================================

  async startMatch(
    { roomId, userId }: { roomId: string; userId: string },
    socketCallbackWithRoomState: (state: BattleState) => void,
    onError?: (message: string) => void
  ) {
    try {
      const session =
        await this.getRoom(
          roomId,
        );

      if (
        session.room.hostId !==
        userId
      ) {
        this.logger.warn('Only the host can start the match');
        onError?.('Only the host can start the match');
      }

      if (
        session.room.status !==
        'WAITING'
      ) {
        this.logger.warn('Match cannot be started now');
        onError?.('Match cannot be started now');
      }

      if (
        !this.canStartMatch(
          session,
        )
      ) {
        this.logger.warn('All players must be ready');
        // onError?.('All players must be ready'); TODO: Decide if this should be an error or not
      }

      const questions =
        await this.questionService
          .loadQuestions(
            session,
          );

      if (
        !questions.length
      ) {
        this.logger.warn('No questions available');
        onError?.('No questions available');
      }

      session.questions =
        questions;

      session.room.status =
        'COUNTDOWN';

      session.room.currentQuestionIndex =
        -1;

      session.room.matchStartedAt =
        Date.now();

      session.room.currentQuestionId =
        undefined;

      session.room.questionStartedAt =
        undefined;

      session.room.questionEndsAt =
        undefined;

      for (
        const player of
        session.users.values()
      ) {
        player.hasAnsweredCurrentQuestion =
          false;
      }

      await this.saveSessionToRedis(
        session,
      );

      socketCallbackWithRoomState(
        this.createRoomState(
          session,
          userId,
        ),
      );
      return;
    } catch (error) {
          this.logger.error(
        'Error starting room',
        error instanceof Error
          ? error.stack
          : String(error),
      );
      onError?.('Failed to start match');
    }
  }

  // ============================================================
  // COUNTDOWN
  // ============================================================

  async runCountdown(
    roomId: string,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    const session =
      await this.getRoom(
        roomId,
      );

    if (
      session.room.status !==
      'COUNTDOWN'
    ) {
      return;
    }

    for (
      let seconds =
        this.countdownSeconds;
      seconds > 0;
      seconds--
    ) {
      const current =
        await this.getRoom(
          roomId,
        );

      if (
        current.room.status !==
        'COUNTDOWN'
      ) {
        return;
      }

      emit(
        'battle:countdown',
        {
          seconds,
        },
      );

      await this.delay(
        1000,
      );
    }

    const latest =
      await this.getRoom(
        roomId,
      );

    if (
      latest.room.status !==
      'COUNTDOWN'
    ) {
      return;
    }

    latest.room.status =
      'PLAYING';

    latest.room.currentQuestionIndex =
      0;

    await this.saveSessionToRedis(
      latest,
    );

    emit(
      'battle:started',
      {
        roomId,
        startedAt:
          Date.now(),
      },
    );

    await this.startCurrentQuestion(
      latest,
      emit,
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  private async startCurrentQuestion(
    session: RoomSession,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    const question =
      session.questions[
      session.room
        .currentQuestionIndex
      ];

    if (!question) {
      await this.finishMatch(
        session,
        emit,
      );

      return;
    }

    session.room.currentQuestionId =
      question.id;

    session.room.questionStartedAt =
      Date.now();

    session.room.questionEndsAt =
      Date.now() +
      question.timeLimitSeconds *
      1000;

    for (
      const player of
      session.users.values()
    ) {
      player.hasAnsweredCurrentQuestion =
        false;
    }

    await this.saveSessionToRedis(
      session,
    );

    emit(
      'battle:question',
      {
        question:
          this.serializeQuestion(
            question,
            session,
          ),
      },
    );

    this.scheduleQuestionTimeout(
      session,
      question,
      emit,
    );
  }

  // ============================================================
  // ANSWER
  // ============================================================

  async submitAnswer(
    roomId: string,
    userId: string,
    questionId: string,
    answerIndex: number,
  ) {
    const session =
      await this.getRoom(
        roomId,
      );

    const user =
      session.users.get(
        userId,
      );

    if (!user) {
      throw new NotFoundException(
        'Player not found',
      );
    }

    if (
      user.status ===
      'LEFT'
    ) {
      throw new ConflictException(
        'Player has left the match',
      );
    }

    if (
      session.room.status !==
      'PLAYING'
    ) {
      throw new ConflictException(
        'Game is not currently playing',
      );
    }

    if (
      session.room.currentQuestionId !==
      questionId
    ) {
      throw new ConflictException(
        'This question is no longer active',
      );
    }

    if (
      session.room.questionEndsAt &&
      Date.now() >=
      session.room.questionEndsAt
    ) {
      throw new ConflictException(
        'Time is over',
      );
    }

    if (
      user.answeredQuestionIds.has(
        questionId,
      )
    ) {
      throw new ConflictException(
        'Question already answered',
      );
    }

    const question =
      this.questionService.getQuestion(
        session,
        questionId,
      );

    if (!question) {
      throw new NotFoundException(
        'Question not found',
      );
    }

    if (
      !Number.isInteger(
        answerIndex,
      ) ||
      answerIndex < 0 ||
      answerIndex >=
      question.options.length
    ) {
      throw new ConflictException(
        'Invalid answer',
      );
    }

    const correct =
      question.correctAnswerIndex ===
      answerIndex;

    const points =
      this.calculatePoints(
        session,
        question,
        correct,
      );

    user.answeredQuestionIds.add(
      questionId,
    );

    user.hasAnsweredCurrentQuestion =
      true;

    user.answeredQuestions++;

    if (correct) {
      user.correctAnswers++;

      user.score +=
        points;
    } else {
      user.incorrectAnswers++;
    }

    user.lastSeenAt =
      Date.now();

    this.rankingService
      .updateRanking(
        session,
      );

    await this.saveSessionToRedis(
      session,
    );

    return {
      correct,

      points,

      score:
        user.score,

      rank:
        user.rank,

      ranking:
        session.ranking,

      userId,

      questionId,
    };
  }

  // ============================================================
  // TIMEOUT
  // ============================================================

  private scheduleQuestionTimeout(
    session: RoomSession,
    question: RoomQuestion,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    if (
      session.timer
    ) {
      clearTimeout(
        session.timer,
      );
    }

    const roomId =
      session.room.roomId;

    const questionId =
      question.id;

    const endsAt =
      session.room.questionEndsAt ??
      Date.now();

    const delay =
      Math.max(
        0,
        endsAt - Date.now(),
      );

    session.timer =
      setTimeout(
        () => {
          void this.handleQuestionTimeout(
            roomId,
            questionId,
            emit,
          );
        },
        delay,
      );
  }

  private async handleQuestionTimeout(
    roomId: string,
    questionId: string,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    try {
      const session =
        await this.getRoom(
          roomId,
        );

      if (
        session.room.status !==
        'PLAYING'
      ) {
        return;
      }

      if (
        session.room.currentQuestionId !==
        questionId
      ) {
        return;
      }

      for (
        const player of
        session.users.values()
      ) {
        if (
          player.status ===
          'LEFT'
        ) {
          continue;
        }

        if (
          !player.answeredQuestionIds.has(
            questionId,
          )
        ) {
          player.incorrectAnswers++;

          player.answeredQuestions++;

          player.answeredQuestionIds.add(
            questionId,
          );

          player.hasAnsweredCurrentQuestion =
            true;
        }
      }

      this.rankingService
        .updateRanking(
          session,
        );

      await this.saveSessionToRedis(
        session,
      );

      emit(
        'battle:time_up',
        {
          questionId,

          endedAt:
            Date.now(),

          ranking:
            session.ranking,
        },
      );

      await this.nextQuestion(
        session,
        emit,
      );
    } catch (error) {
      this.logger.error(
        `Question timeout failed | room=${roomId}`,
        error,
      );
    }
  }

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  private async nextQuestion(
    session: RoomSession,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    if (
      session.timer
    ) {
      clearTimeout(
        session.timer,
      );

      session.timer =
        undefined;
    }

    session.room.currentQuestionIndex++;

    const next =
      session.questions[
      session.room
        .currentQuestionIndex
      ];

    if (!next) {
      await this.finishMatch(
        session,
        emit,
      );

      return;
    }

    await this.saveSessionToRedis(
      session,
    );

    emit(
      'battle:next_question',
      {
        questionIndex:
          session.room
            .currentQuestionIndex,
      },
    );

    await this.startCurrentQuestion(
      session,
      emit,
    );
  }

  // ============================================================
  // FINISH
  // ============================================================

  private async finishMatch(
    session: RoomSession,
    emit: (
      event: string,
      data: unknown,
    ) => void,
  ) {
    if (
      session.timer
    ) {
      clearTimeout(
        session.timer,
      );

      session.timer =
        undefined;
    }

    session.room.status =
      'FINISHED';

    session.room.finishedAt =
      Date.now();

    session.room.currentQuestionId =
      undefined;

    session.room.questionStartedAt =
      undefined;

    session.room.questionEndsAt =
      undefined;

    this.rankingService
      .updateRanking(
        session,
      );

    await this.saveSessionToRedis(
      session,
    );

    emit(
      'battle:finished',
      {
        roomId:
          session.room.roomId,

        ranking:
          session.ranking,

        finishedAt:
          session.room.finishedAt,
      },
    );
  }

  // ============================================================
  // DISCONNECT
  // ============================================================

  async disconnectUser(
    roomId: string,
    userId: string,
  ) {
    const session =
      await this.getRoom(
        roomId,
      );

    const user =
      session.users.get(
        userId,
      );

    if (!user) {
      return null;
    }

    user.status =
      'DISCONNECTED';

    user.disconnectedAt =
      Date.now();

    user.lastSeenAt =
      Date.now();

    await this.saveSessionToRedis(
      session,
    );

    setTimeout(
      () => {
        void this.removeExpiredPlayer(
          roomId,
          userId,
        );
      },
      this.reconnectGracePeriod,
    );

    return this.serializePublicUser(
      user,
    );
  }

  // ============================================================
  // REMOVE EXPIRED PLAYER
  // ============================================================

  private async removeExpiredPlayer(
    roomId: string,
    userId: string,
  ) {
    const session =
      this.sessions.get(
        roomId,
      );

    if (!session) {
      return;
    }

    const user =
      session.users.get(
        userId,
      );

    if (!user) {
      return;
    }

    if (
      user.status !==
      'DISCONNECTED'
    ) {
      return;
    }

    const disconnectedAt =
      user.disconnectedAt ?? 0;

    if (
      Date.now() -
      disconnectedAt <
      this.reconnectGracePeriod
    ) {
      return;
    }

    user.status =
      'LEFT';

    user.ready =
      false;

    this.rankingService
      .updateRanking(
        session,
      );

    await this.saveSessionToRedis(
      session,
    );
  }

  // ============================================================
  // LEAVE
  // ============================================================

  async leaveRoom(
    roomId: string,
    userId: string,
  ) {
    const session =
      await this.getRoom(
        roomId,
      );

    const user =
      session.users.get(
        userId,
      );

    if (!user) {
      throw new NotFoundException(
        'Player not found',
      );
    }

    if (
      session.room.hostId ===
      userId &&
      session.room.status ===
      'WAITING'
    ) {
      session.room.status =
        'CANCELLED';
    }

    user.status =
      'LEFT';

    user.ready =
      false;

    this.rankingService
      .updateRanking(
        session,
      );

    await this.saveSessionToRedis(
      session,
    );

    return this.createRoomState(
      session,
      userId,
    );
  }

  // ============================================================
  // STATE
  // ============================================================

  createRoomState(
    session: RoomSession,
    userId?: string,
  ): BattleState {
    const currentQuestion =
      session.questions[
      session.room.currentQuestionIndex
      ] ?? null;

    const currentUser =
      userId
        ? session.users.get(
          userId,
        )
        : undefined;

    const timerSeconds =
      session.room.questionEndsAt
        ? Math.max(
          0,
          Math.ceil(
            (
              session.room.questionEndsAt -
              Date.now()
            ) / 1000,
          ),
        )
        : 0;

    const players =
      [...session.users.values()]

    return {
      phase:
        session.room.status ===
          'WAITING'
          ? 'LOBBY'
          : session.room.status ===
            'FINISHED'
            ? 'FINISHED'
            : 'QUESTION',

      room:
        session.room,

      players,

      allReady:
        this.areAllPlayersReady(
          session,
        ),

      currentQuestion,

      questionIndex:
        session.room.currentQuestionIndex,

      totalQuestions:
        session.questions.length,

      timerSeconds,

      selectedOptionId:
        null,

      hasAnsweredCurrent:
        currentUser?.hasAnsweredCurrentQuestion ??
        false,

      lastAnswerCorrect:
        null,

      lastPointsEarned:
        0,

      rankings:
        session.ranking.rankings,

      errorEvent:
        null,

      errorMessage:
        null,
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private canStartMatch(
    session: RoomSession,
  ): boolean {
    const players =
      [...session.users.values()]
        .filter(
          user =>
            user.status !==
            'LEFT',
        );

    if (
      players.length < 2
    ) {
      return false;
    }

    return players.every(
      user =>
        user.ready === true,
    );
  }

  private areAllPlayersReady(
    session: RoomSession,
  ): boolean {
    const players =
      [...session.users.values()]
        .filter(
          user =>
            user.status !==
            'LEFT',
        );

    if (
      players.length === 0
    ) {
      return false;
    }

    return players.every(
      user =>
        user.ready,
    );
  }

  private getActivePlayerCount(
    session: RoomSession,
  ): number {
    return [
      ...session.users.values(),
    ].filter(
      user =>
        user.status !==
        'LEFT',
    ).length;
  }

  private calculatePoints(
    session: RoomSession,
    question: RoomQuestion,
    correct: boolean,
  ): number {
    if (!correct) {
      return 0;
    }

    /**
     * Base points.
     */
    const base =
      100;

    /**
     * Speed bonus.
     */
    const startedAt =
      session.room
        .questionStartedAt ??
      Date.now();

    const endsAt =
      session.room
        .questionEndsAt ??
      Date.now();

    const remaining =
      Math.max(
        0,
        endsAt - Date.now(),
      );

    const total =
      Math.max(
        1,
        endsAt - startedAt,
      );

    const speedRatio =
      remaining / total;

    const speedBonus =
      Math.floor(
        speedRatio * 50,
      );

    return (
      base +
      speedBonus
    );
  }

  private serializeQuestion(
    question: RoomQuestion,
    session: RoomSession,
  ) {
    return {
      id:
        question.id,

      question:
        question.question,

      options:
        question.options,

      category:
        question.category,

      difficulty:
        question.difficulty,

      timeLimitSeconds:
        question.timeLimitSeconds,

      startedAt:
        session.room
          .questionStartedAt,

      endsAt:
        session.room
          .questionEndsAt,
    };
  }

  private serializePublicUser(
    user: RoomSessionUser,
  ) {
    return {
      userId:
        user.userId,

      username:
        user.username,

      profilePicture:
        user.profilePicture ?? null,

      avatarId:
        user.avatarId,

      status:
        user.status,

      ready:
        user.ready,

      joinedAt:
        user.joinedAt,

      score:
        user.score,

      correctAnswers:
        user.correctAnswers,

      answeredQuestions:
        user.answeredQuestions,

      rank:
        user.rank,

      hasAnsweredCurrentQuestion:
        user.hasAnsweredCurrentQuestion,
    };
  }

  private serializePrivateUser(
    user: RoomSessionUser,
  ) {
    return {
      ...this.serializePublicUser(
        user,
      ),

      incorrectAnswers:
        user.incorrectAnswers,
    };
  }

  // ============================================================
  // REDIS
  // ============================================================

  private async saveSessionToRedis(
    session: RoomSession,
  ) {
    const data = {
      room:
        session.room,

      users:
        [...session.users.values()]
          .map(
            user => ({
              ...user,

              answeredQuestionIds:
                [
                  ...user.answeredQuestionIds,
                ],
            }),
          ),

      ranking:
        session.ranking,

      questions:
        session.questions,

      updatedAt:
        Date.now(),
    };

    await this.redisService.set(
      `quiz:battle:room:${session.room.roomId}`,
      JSON.stringify(data),
    );
  }

  private async loadSessionFromRedis(
    roomId: string,
  ): Promise<RoomSession | null> {
    const data =
      await this.redisService.get(
        `quiz:battle:room:${roomId}`,
      );

    if (!data) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(
          data.toString(),
        );

      const users =
        new Map<
          string,
          RoomSessionUser
        >();

      for (
        const user of
        parsed.users ?? []
      ) {
        users.set(
          user.userId,
          {
            ...user,

            ready:
              user.ready ?? false,

            answeredQuestionIds:
              new Set(
                user
                  .answeredQuestionIds ??
                [],
              ),
          },
        );
      }

      return {
        room:
          parsed.room,

        users,

        ranking:
          parsed.ranking,

        questions:
          parsed.questions ??
          [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to restore room ${roomId}`,
        error,
      );

      return null;
    }
  }

  // ============================================================
  // IDS
  // ============================================================

  private generateRoomId(): string {
    return crypto.randomUUID();
  }

  private generateRoomCode(): string {
    const characters =
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    let code = '';

    for (
      let i = 0;
      i < 6;
      i++
    ) {
      code +=
        characters[
        Math.floor(
          Math.random() *
          characters.length,
        )
        ];
    }

    return code;
  }

  private delay(
    ms: number,
  ): Promise<void> {
    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms,
        ),
    );
  }
}