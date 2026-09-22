/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleServiceModule = void 0;
const common_1 = __webpack_require__(3);
const quiz_battle_service_controller_1 = __webpack_require__(4);
const quiz_battle_service_service_1 = __webpack_require__(5);
const config_1 = __webpack_require__(9);
const redis_1 = __webpack_require__(6);
const events_gateway_1 = __webpack_require__(22);
const quiz_battle_question_service_1 = __webpack_require__(18);
const quiz_battle_ranking_service_1 = __webpack_require__(20);
const events_service_1 = __webpack_require__(25);
const player_game_state_service_1 = __webpack_require__(21);
let QuizBattleServiceModule = class QuizBattleServiceModule {
};
exports.QuizBattleServiceModule = QuizBattleServiceModule;
exports.QuizBattleServiceModule = QuizBattleServiceModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [quiz_battle_service_controller_1.QuizBattleServiceController],
        providers: [
            quiz_battle_service_service_1.QuizBattleService,
            redis_1.RedisService,
            events_gateway_1.EventsGateway,
            quiz_battle_question_service_1.QuizBattleQuestionService,
            quiz_battle_ranking_service_1.QuizBattleRankingService,
            player_game_state_service_1.PlayerGameStateService,
            events_service_1.EventsService,
        ],
    })
], QuizBattleServiceModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleServiceController = void 0;
const common_1 = __webpack_require__(3);
const quiz_battle_service_service_1 = __webpack_require__(5);
let QuizBattleServiceController = class QuizBattleServiceController {
    quizBattleService;
    constructor(quizBattleService) {
        this.quizBattleService = quizBattleService;
    }
    async getRoomSession(roomCode) {
        return await this.quizBattleService.getRoomData(roomCode);
    }
};
exports.QuizBattleServiceController = QuizBattleServiceController;
__decorate([
    (0, common_1.Get)('/room/:roomCode'),
    __param(0, (0, common_1.Param)('roomCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuizBattleServiceController.prototype, "getRoomSession", null);
exports.QuizBattleServiceController = QuizBattleServiceController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof quiz_battle_service_service_1.QuizBattleService !== "undefined" && quiz_battle_service_service_1.QuizBattleService) === "function" ? _a : Object])
], QuizBattleServiceController);


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuizBattleService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleService = void 0;
const common_1 = __webpack_require__(3);
const redis_1 = __webpack_require__(6);
const quiz_battle_question_service_1 = __webpack_require__(18);
const quiz_battle_ranking_service_1 = __webpack_require__(20);
const player_game_state_service_1 = __webpack_require__(21);
let QuizBattleService = QuizBattleService_1 = class QuizBattleService {
    redisService;
    questionService;
    rankingService;
    playerGameStateService;
    logger = new common_1.Logger(QuizBattleService_1.name);
    sessions = new Map();
    reconnectGracePeriod = 10 * 60 * 1000;
    countdownSeconds = 3;
    subscriber = null;
    disconnectTimers = new Map();
    constructor(redisService, questionService, rankingService, playerGameStateService) {
        this.redisService = redisService;
        this.questionService = questionService;
        this.rankingService = rankingService;
        this.playerGameStateService = playerGameStateService;
    }
    async onModuleInit() {
        this.subscriber = this.redisService.client.duplicate();
        await this.subscriber.psubscribe('__keyevent@0__:expired');
        this.subscriber.on('pmessage', async (_pattern, _channel, key) => {
            const match = key.match(/^game:room:(.+):expiration$/);
            if (!match)
                return;
            const roomId = match[1];
            try {
                await this.handleRoomExpiration(roomId);
            }
            catch (error) {
                this.logger.error(`Failed to handle room expiration | room=${roomId}`, error instanceof Error ? error.stack : String(error));
            }
        });
    }
    async onModuleDestroy() {
        if (!this.subscriber)
            return;
        await this.subscriber.punsubscribe('__keyevent@0__:expired');
        await this.subscriber.quit();
    }
    async handleRoomExpiration(roomId) {
        const session = await this.getRoom(roomId);
        if (!session) {
            this.logger.warn(`Expired room not found | room=${roomId}`);
            return;
        }
        session.room.status = 'FINISHED';
        session.room.finishedAt = Date.now();
        session.room.currentQuestionId = undefined;
        session.room.questionStartedAt = undefined;
        session.room.questionEndsAt = undefined;
        if (session.timer) {
            clearTimeout(session.timer);
            session.timer = undefined;
        }
        for (const [key, timer] of this.disconnectTimers.entries()) {
            if (key.startsWith(`${roomId}:`)) {
                clearTimeout(timer);
                this.disconnectTimers.delete(key);
            }
        }
        this.rankingService.updateRanking(session);
        const players = [...session.users.values()];
        await Promise.all(players.map((player) => this.playerGameStateService.leaveGame(player.userId)));
        await this.saveSessionToRedis(session, 5 * 60 * 1000);
        this.sessions.delete(roomId);
        this.logger.debug(`Room finished & cleaned up | room=${roomId}`);
    }
    async checkReconnectGame(userId, clientTime, socketCallbackWithRoomState, onError) {
        try {
            const roomId = await this.playerGameStateService.getRoomId(userId);
            if (!roomId) {
                return;
            }
            const roomData = await this.getRoom(roomId);
            if (!roomData) {
                this.logger.error(`User ${userId} trying to reconnect to a non-existent room ${roomId}`);
                await this.playerGameStateService.leaveGame(userId);
                return;
            }
            if (roomData.room.status === 'FINISHED') {
                socketCallbackWithRoomState(this.createRoomState(roomData, userId));
                return;
            }
            const isExpired = await this.isRoomExpired(roomId);
            if (isExpired) {
                this.logger.warn(`User ${userId} reconnecting to expired room ${roomId}; finalizing`);
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
            if (player?.allQuestionsAnswered) {
                socketCallbackWithRoomState(this.createRoomState(roomData, userId));
                return;
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
                await this.saveSessionToRedis(roomData);
            }
            socketCallbackWithRoomState(this.createRoomState(roomData, userId));
            return;
        }
        catch (error) {
            this.logger.error(`Reconnect check failed | user=${userId}`, error instanceof Error ? error.stack : String(error));
            onError?.('Failed to check reconnect state');
        }
    }
    async reconnectGame(userId, clientTime, socketCallbackWithRoomState, errorCallback) {
        try {
            const roomId = await this.playerGameStateService.getRoomId(userId);
            if (!roomId) {
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
        }
        catch (error) {
            this.logger.error(`Reconnect failed | user=${userId}`, error instanceof Error ? error.stack : String(error));
            errorCallback('Failed to reconnect');
        }
    }
    async createRoom(body, socketCallbackWithRoomState, onError) {
        try {
            const host = body.host;
            const roomCode = this.generateRoomCode();
            const now = Date.now();
            const room = {
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
            const hostUser = {
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
                answeredQuestionIds: new Set(),
                allQuestionsAnswered: false,
            };
            const questions = await this.questionService.generateQuestions({
                topic: room.topic,
                difficulty: room.difficulty,
                numberOfQuestions: room.numberOfQuestions,
                prompt: room.prompt,
                mode: room.mode,
            });
            if (!questions.length) {
                this.logger.warn('No questions generated for the room');
                onError?.('No questions available for the selected topic and difficulty');
                return;
            }
            const session = {
                room,
                users: new Map([[host.userId, hostUser]]),
                ranking: {
                    roomId: room.roomId,
                    rankings: [],
                    updatedAt: now,
                },
                questions: questions,
            };
            this.rankingService.updateRanking(session);
            this.sessions.set(session.room.roomId, session);
            await this.saveSessionToRedis(session);
            const state = this.createRoomState(session, host.userId);
            await this.playerGameStateService.enterGame(host.userId, roomCode);
            socketCallbackWithRoomState(state);
            return;
        }
        catch (error) {
            this.logger.error('Error creating room', error instanceof Error ? error.stack : String(error));
            onError?.('An error occurred while creating the room');
        }
    }
    async getRoomData(roomId) {
        const session = await this.getRoom(roomId);
        if (!session)
            return null;
        return this.createRoomState(session);
    }
    async getRoom(roomId, onError) {
        const normalized = roomId?.trim();
        if (!normalized) {
            this.logger.warn('Room id is required');
            onError?.('Room id is required');
            return null;
        }
        const local = this.sessions.get(normalized);
        if (local)
            return local;
        const restored = await this.loadSessionFromRedis(normalized);
        if (!restored) {
            this.logger.warn(`Room not found | room=${normalized}`);
            onError?.('Room not found');
            return null;
        }
        this.sessions.set(normalized, restored);
        return restored;
    }
    async joinRoom(roomId, user, socketCallbackWithRoomState, onError) {
        try {
            const session = await this.getRoom(roomId);
            if (!session) {
                onError?.('Room not found');
                return;
            }
            const existing = session.users.get(user.userId);
            if (existing) {
                if (existing.status === 'LEFT') {
                    onError?.('You have left this match');
                    return;
                }
                existing.status = 'CONNECTED';
                existing.lastSeenAt = Date.now();
                existing.disconnectedAt = undefined;
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
            const newUser = {
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
                answeredQuestionIds: new Set(),
                allQuestionsAnswered: false,
            };
            session.users.set(user.userId, newUser);
            this.rankingService.updateRanking(session);
            await this.saveSessionToRedis(session);
            socketCallbackWithRoomState(this.createRoomState(session, user.userId));
            await this.playerGameStateService.enterGame(user.userId, roomId);
            return;
        }
        catch (error) {
            this.logger.error('Error joining room', error instanceof Error ? error.stack : String(error));
            onError?.('An error occurred while joining the room');
        }
    }
    async setPlayerReady({ roomId, userId, ready, }, socketCallbackWithRoomState, onError) {
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
    async startMatch({ roomId, userId }, socketCallbackWithRoomState, onError) {
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
            const durationMs = (session.room.totalTimeSeconds || 600) * 1000;
            await this.playerGameStateService.startGame(roomId, durationMs);
            socketCallbackWithRoomState(this.createRoomState(session, userId));
            return;
        }
        catch (error) {
            this.logger.error('Error starting room', error instanceof Error ? error.stack : String(error));
            onError?.('Failed to start match');
            return;
        }
    }
    async disconnectUser(roomId, userId, onError) {
        const session = await this.getRoom(roomId);
        if (!session) {
            onError?.('Room not found');
            this.logger.warn(`Room not found | room=${roomId}`);
            return null;
        }
        const user = session.users.get(userId);
        if (!user)
            return null;
        user.status = 'DISCONNECTED';
        user.disconnectedAt = Date.now();
        user.lastSeenAt = Date.now();
        await this.saveSessionToRedis(session);
        const timerKey = `${roomId}:${userId}`;
        const existing = this.disconnectTimers.get(timerKey);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(() => {
            this.disconnectTimers.delete(timerKey);
            void this.removeExpiredPlayer(roomId, userId);
        }, this.reconnectGracePeriod);
        if (typeof timer.unref === 'function')
            timer.unref();
        this.disconnectTimers.set(timerKey, timer);
        return this.serializePublicUser(user);
    }
    async leaveRoom({ roomId, userId }, socketCallbackWithRoomState, onError) {
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
        }
        catch (error) {
            this.logger.error('Error leaving room', error instanceof Error ? error.stack : String(error));
            onError?.('An error occurred while leaving the room');
        }
    }
    async answerAttempt({ roomId, userId, qId, oId, }, socketCallbackWithRoomState, onError) {
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
            if (user.status === 'LEFT') {
                onError?.('Player has left the match');
                return;
            }
            if (session.room.status !== 'PLAYING') {
                onError?.('Game is not currently playing');
                return;
            }
            const sessionLength = session.questions.length;
            const questionIndex = session.questions.findIndex((item) => item.id === qId);
            if (questionIndex === -1) {
                onError?.('This question is no longer active');
                return;
            }
            if (session.room.questionEndsAt &&
                Date.now() >= session.room.questionEndsAt) {
                onError?.('Time is over');
                return;
            }
            if (user.answeredQuestionIds.has(qId)) {
                onError?.('Question already answered');
                return;
            }
            const question = session.questions[questionIndex];
            if (!question) {
                onError?.('Question not found');
                return;
            }
            const selectedOption = question.options?.find((option) => option.id === oId);
            if (!selectedOption) {
                onError?.('Invalid answer');
                return;
            }
            const correct = question.correctOptionId === oId;
            const points = correct ? Math.max(0, question.points ?? 0) : 0;
            user.answeredQuestionIds.add(qId);
            user.hasAnsweredCurrentQuestion = true;
            user.answeredQuestions++;
            user.allQuestionsAnswered =
                user.answeredQuestionIds.size >= sessionLength;
            if (user.allQuestionsAnswered) {
                await this.playerGameStateService.leaveGame(userId);
            }
            if (correct) {
                user.correctAnswers++;
                user.score += points;
            }
            else {
                user.incorrectAnswers++;
            }
            user.lastSeenAt = Date.now();
            this.rankingService.updateRanking(session);
            await this.saveSessionToRedis(session);
            socketCallbackWithRoomState(this.createRoomState(session, userId));
            return;
        }
        catch (error) {
            this.logger.error('Error answering question', error instanceof Error ? error.stack : String(error));
            onError?.('An error occurred while submitting an answer');
        }
    }
    createRoomState(session, userId) {
        const currentQuestion = session.questions[session.room.currentQuestionIndex] ?? null;
        const currentUser = userId ? session.users.get(userId) : undefined;
        const timerSeconds = session.room.questionEndsAt
            ? Math.max(0, Math.ceil((session.room.questionEndsAt - Date.now()) / 1000))
            : 0;
        const players = [...session.users.values()];
        return {
            phase: session.room.status === 'WAITING'
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
    async removeExpiredPlayer(roomId, userId) {
        const session = this.sessions.get(roomId);
        if (!session)
            return;
        const user = session.users.get(userId);
        if (!user)
            return;
        if (user.status !== 'DISCONNECTED')
            return;
        const disconnectedAt = user.disconnectedAt ?? 0;
        if (Date.now() - disconnectedAt < this.reconnectGracePeriod)
            return;
        user.status = 'LEFT';
        user.ready = false;
        this.rankingService.updateRanking(session);
        await this.saveSessionToRedis(session);
    }
    async isRoomExpired(roomId) {
        const session = this.sessions.get(roomId);
        const status = session?.room.status;
        if (status === 'WAITING' || status === 'COUNTDOWN') {
            return false;
        }
        const exists = await this.redisService.client.exists(`game:room:${roomId}:expiration`);
        return exists === 0;
    }
    areAllPlayersReady(session) {
        const players = [...session.users.values()].filter((user) => user.status !== 'LEFT');
        if (players.length === 0)
            return false;
        return players.every((user) => user.ready);
    }
    getActivePlayerCount(session) {
        return [...session.users.values()].filter((user) => user.status !== 'LEFT')
            .length;
    }
    serializePublicUser(user) {
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
    async saveSessionToRedis(session, ttlOverrideMs) {
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
        const ttlMs = ttlOverrideMs ?? (session.room.totalTimeSeconds ?? 600) * 1000 + 60_000;
        await this.redisService.client.set(key, JSON.stringify(data), 'PX', ttlMs);
    }
    async loadSessionFromRedis(roomId) {
        const data = await this.redisService.client.get(`quiz:battle:room:${roomId}`);
        if (!data)
            return null;
        try {
            const parsed = JSON.parse(data.toString());
            const users = new Map();
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
        }
        catch (error) {
            this.logger.error(`Failed to restore room ${roomId}`, error);
            return null;
        }
    }
    generateRoomCode() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters[Math.floor(Math.random() * characters.length)];
        }
        return code;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.QuizBattleService = QuizBattleService;
exports.QuizBattleService = QuizBattleService = QuizBattleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisService !== "undefined" && redis_1.RedisService) === "function" ? _a : Object, typeof (_b = typeof quiz_battle_question_service_1.QuizBattleQuestionService !== "undefined" && quiz_battle_question_service_1.QuizBattleQuestionService) === "function" ? _b : Object, typeof (_c = typeof quiz_battle_ranking_service_1.QuizBattleRankingService !== "undefined" && quiz_battle_ranking_service_1.QuizBattleRankingService) === "function" ? _c : Object, typeof (_d = typeof player_game_state_service_1.PlayerGameStateService !== "undefined" && player_game_state_service_1.PlayerGameStateService) === "function" ? _d : Object])
], QuizBattleService);


/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(7), exports);
__exportStar(__webpack_require__(8), exports);


/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(3);
const redis_service_1 = __webpack_require__(8);
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            redis_service_1.RedisService,
        ],
        exports: [
            redis_service_1.RedisService,
        ],
    })
], RedisModule);


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const config_1 = __webpack_require__(9);
const common_1 = __webpack_require__(3);
const ioredis_1 = __importDefault(__webpack_require__(17));
let RedisService = RedisService_1 = class RedisService {
    configService;
    client;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.getEnv('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is not defined');
        }
        this.client = new ioredis_1.default(redisUrl);
    }
    async onModuleInit() {
        await this.client.config('SET', 'notify-keyspace-events', 'Ex');
        this.logger.log('Redis key expiration notifications enabled');
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    async get(key) {
        const value = await this.client.get(key);
        if (!value) {
            return null;
        }
        return JSON.parse(value);
    }
    async set(key, value, ttl) {
        const data = JSON.stringify(value);
        if (ttl) {
            await this.client.set(key, data, 'EX', ttl);
            return;
        }
        await this.client.set(key, data);
    }
    async delete(key) {
        await this.client.del(key);
    }
    async exists(key) {
        return this.client.exists(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RedisService);


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(10), exports);
__exportStar(__webpack_require__(11), exports);


/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigModule = void 0;
const common_1 = __webpack_require__(3);
const config_service_1 = __webpack_require__(11);
const config_1 = __webpack_require__(12);
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
        ],
        providers: [config_service_1.ConfigService],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(12);
const fs_1 = __webpack_require__(13);
const path = __importStar(__webpack_require__(14));
const child_process_1 = __webpack_require__(15);
const services_configs_1 = __importDefault(__webpack_require__(16));
let ConfigService = class ConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    configFilePath = path.join(process.cwd(), 'libs', 'config', 'src', 'micro-services-configs.ts');
    getConfig() {
        return services_configs_1.default;
    }
    getEnv(key) {
        return this.configService.get(key);
    }
    getAllEnvs() {
        return {
            DATABASE_URL: process.env.DATABASE_URL,
            REDIS_URL: process.env.REDIS_URL,
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            TCP_HOST: process.env.TCP_HOST,
            TCP_PORT: process.env.TCP_PORT,
        };
    }
    getEnvKeys() {
        return [
            'DATABASE_URL',
            'REDIS_URL',
            'NODE_ENV',
            'PORT',
            'TCP_HOST',
            'TCP_PORT',
        ];
    }
    getEnvObject() {
        return this.getAllEnvs();
    }
    updateConfig(serviceName, key, value) {
        const config = this.getConfig();
        if (!config?.[serviceName]) {
            throw new Error(`Service config for "${serviceName}" not found.`);
        }
        config[serviceName][key] = value;
        this.persistConfig(config);
        setTimeout(() => {
            this.restartApp();
        }, 100);
        return config;
    }
    addAppConfig(serviceName, appConfig) {
        const config = this.getConfig();
        config[serviceName] = {
            ...(config[serviceName] ?? {}),
            ...appConfig,
        };
        this.persistConfig(config);
        return config;
    }
    persistConfig(config) {
        const fileContent = `const MICRO_SERVICES_CONFIGS = ${JSON.stringify(config, null, 4)};

export default MICRO_SERVICES_CONFIGS;
`;
        (0, fs_1.writeFileSync)(this.configFilePath, fileContent, 'utf8');
    }
    restartApp() {
        const child = (0, child_process_1.spawn)(process.argv[0], process.argv.slice(1), {
            detached: true,
            stdio: 'inherit',
        });
        child.unref();
        process.exit(0);
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ConfigService);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const MICRO_SERVICES_CONFIGS = {
    "EVENT_SERVICE": {
        "APP_NAME": "EVENT_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3003,
        "MICROSERVICE_PORT": 3300,
        "MICROSERVICE_HOST": "localhost"
    },
    "NOTIFICATION_SERVICE": {
        "APP_NAME": "NOTIFICATION_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3004,
        "MICROSERVICE_HOST": "localhost",
        "MICROSERVICE_PORT": 3400
    },
    "REALTIME_SERVICE": {
        "APP_NAME": "REALTIME_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3004,
        "MICROSERVICE_HOST": "localhost",
        "MICROSERVICE_PORT": 3500
    }
};
exports["default"] = MICRO_SERVICES_CONFIGS;


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuizBattleQuestionService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleQuestionService = void 0;
const common_1 = __webpack_require__(3);
const genai_1 = __webpack_require__(19);
let QuizBattleQuestionService = QuizBattleQuestionService_1 = class QuizBattleQuestionService {
    logger = new common_1.Logger(QuizBattleQuestionService_1.name);
    ai;
    model;
    maxRetries;
    timeoutMs;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        this.ai = new genai_1.GoogleGenAI({
            apiKey,
        });
        this.model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
        this.maxRetries = this.parseNumber(process.env.GEMINI_MAX_RETRIES, 3);
        this.timeoutMs = this.parseNumber(process.env.GEMINI_TIMEOUT_MS, 30000);
        this.logger.log(`Gemini initialized | model=${this.model} | retries=${this.maxRetries} | timeout=${this.timeoutMs}ms`);
    }
    async generateQuestions(options) {
        const numberOfQuestions = this.normalizeQuestionCount(options.numberOfQuestions);
        const difficulty = this.normalizeDifficulty(options.difficulty);
        const topic = options.topic?.trim() || 'General Knowledge';
        const prompt = options.prompt?.trim() || '';
        const mode = options.mode?.trim() || 'CLASSIC';
        this.logger.log(`Generating quiz | topic="${topic}" | difficulty=${difficulty} | questions=${numberOfQuestions} | mode=${mode}`);
        const aiResponse = await this.requestQuestionsFromAI({
            topic,
            difficulty,
            numberOfQuestions,
            prompt,
            mode,
        });
        return this.transformQuestions(aiResponse.questions, {
            topic,
            difficulty,
        });
    }
    getQuestion(session, questionId) {
        return (session.questions.find((question) => question.id === questionId) ?? null);
    }
    async requestQuestionsFromAI(options) {
        const { topic, difficulty, numberOfQuestions, prompt, mode } = options;
        const systemPrompt = `
You are the official AI Quiz Generator for a
multiplayer game called QuizBattle.

Your task is to generate high-quality multiple-choice
quiz questions.

QUIZ CONFIGURATION:

Topic:
${topic}

Difficulty:
${difficulty}

Number of questions:
${numberOfQuestions}

Game mode:
${mode}

Additional user instructions:
${prompt || 'None'}

STRICT RULES:

1. Generate EXACTLY ${numberOfQuestions} questions.

2. Every question must contain EXACTLY 4 options.

3. Every question must have EXACTLY ONE correct option.

4. correctOptionIndex must be:
   0 = first option
   1 = second option
   2 = third option
   3 = fourth option

5. Options must be unique.

6. Questions must be unique.

7. Do not use:
   - All of the above
   - None of the above

8. Do not create subjective questions.

9. Do not create ambiguous questions.

10. Incorrect options should be plausible.

11. Questions must be factually accurate.

12. Do not put the answer inside the question itself.

13. Do not use markdown.

14. Keep explanations short and factual.

15. The output must contain ONLY the requested JSON.

DIFFICULTY:

EASY:
- Basic knowledge.
- Straightforward questions.
- Suitable for approximately 15 seconds.

MEDIUM:
- Requires reasonable knowledge or thinking.
- Suitable for approximately 20 seconds.

HARD:
- Requires deeper knowledge or reasoning.
- Suitable for approximately 30 seconds.

QUESTION TYPES:

Use normal competitive MCQ questions.

Do not generate:
- Yes/No questions.
- True/False questions.
- Multiple-correct questions.
- Subjective questions.

QUALITY:

Before returning the response, internally verify:

- Correct number of questions.
- Exactly 4 options per question.
- One correct answer.
- No duplicate questions.
- No duplicate options.
- Correct option index is 0-3.
`;
        const userPrompt = `
Generate the QuizBattle quiz now.

Topic:
${topic}

Difficulty:
${difficulty}

Questions:
${numberOfQuestions}

Mode:
${mode}

Additional instructions:
${prompt || 'None'}
`;
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: systemPrompt + '\n\n' + userPrompt,
                    },
                ],
            },
        ];
        const config = {
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: this.getQuizResponseSchema(),
        };
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.logger.debug(`Gemini request attempt ${attempt}/${this.maxRetries}`);
                const response = await this.generateContentWithTimeout(contents, config);
                const text = response.text?.trim();
                if (!text) {
                    throw new Error('Gemini returned an empty response');
                }
                this.logger.debug(`Gemini response received (${text.length} chars)`);
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    throw new Error('Gemini returned invalid JSON');
                }
                this.validateAIResponse(parsed, numberOfQuestions);
                return parsed;
            }
            catch (error) {
                lastError = error;
                const retryable = this.isRetryableError(error);
                this.logger.warn(`Gemini attempt ${attempt} failed | retryable=${retryable} | error=${this.getErrorMessage(error)}`);
                if (!retryable) {
                    break;
                }
                if (attempt >= this.maxRetries) {
                    break;
                }
                const delay = this.calculateBackoff(attempt);
                this.logger.warn(`Retrying Gemini request in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        this.logger.error('Gemini quiz generation failed after retries', lastError instanceof Error ? lastError.stack : String(lastError));
        throw new common_1.InternalServerErrorException('Unable to generate quiz questions right now. Please try again.');
    }
    getQuizResponseSchema() {
        return {
            type: genai_1.Type.OBJECT,
            properties: {
                questions: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            question: {
                                type: genai_1.Type.STRING,
                            },
                            options: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        text: {
                                            type: genai_1.Type.STRING,
                                        },
                                    },
                                    required: ['text'],
                                },
                            },
                            correctOptionIndex: {
                                type: genai_1.Type.INTEGER,
                            },
                            explanation: {
                                type: genai_1.Type.STRING,
                            },
                        },
                        required: [
                            'question',
                            'options',
                            'correctOptionIndex',
                            'explanation',
                        ],
                    },
                },
            },
            required: ['questions'],
        };
    }
    async generateContentWithTimeout(contents, config) {
        const request = this.ai.models.generateContent({
            model: this.model,
            contents,
            config,
        });
        const timeout = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Gemini request timed out after ${this.timeoutMs}ms`));
            }, this.timeoutMs);
        });
        return Promise.race([request, timeout]);
    }
    isRetryableError(error) {
        const message = this.getErrorMessage(error).toLowerCase();
        const status = this.getErrorStatus(error);
        if (status === 429 || status === 500 || status === 503 || status === 504) {
            return true;
        }
        if (message.includes('unavailable') ||
            message.includes('overloaded') ||
            message.includes('high demand') ||
            message.includes('timeout') ||
            message.includes('timed out') ||
            message.includes('econnreset') ||
            message.includes('socket') ||
            message.includes('temporarily')) {
            return true;
        }
        return false;
    }
    getErrorStatus(error) {
        return (error?.status ?? error?.code ?? error?.error?.status ?? error?.error?.code);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        try {
            return JSON.stringify(error);
        }
        catch {
            return String(error);
        }
    }
    calculateBackoff(attempt) {
        const base = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 500);
        return Math.min(base + jitter, 8000);
    }
    sleep(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    validateAIResponse(response, expectedCount) {
        if (!response || !Array.isArray(response.questions)) {
            throw new Error('Invalid AI quiz response');
        }
        if (response.questions.length !== expectedCount) {
            throw new Error(`Expected ${expectedCount} questions but received ${response.questions.length}`);
        }
        const questionTexts = new Set();
        for (let i = 0; i < response.questions.length; i++) {
            const question = response.questions[i];
            if (!question ||
                typeof question.question !== 'string' ||
                !question.question.trim()) {
                throw new Error(`Question ${i + 1} has invalid text`);
            }
            const normalizedQuestion = this.normalizeText(question.question);
            if (questionTexts.has(normalizedQuestion)) {
                throw new Error(`Duplicate question detected at index ${i}`);
            }
            questionTexts.add(normalizedQuestion);
            if (!Array.isArray(question.options) || question.options.length !== 4) {
                throw new Error(`Question ${i + 1} must contain exactly 4 options`);
            }
            const optionTexts = question.options.map((option) => option?.text?.trim().toLowerCase());
            if (optionTexts.some((text) => !text)) {
                throw new Error(`Question ${i + 1} contains an empty option`);
            }
            if (new Set(optionTexts).size !== 4) {
                throw new Error(`Question ${i + 1} contains duplicate options`);
            }
            if (!Number.isInteger(question.correctOptionIndex) ||
                question.correctOptionIndex < 0 ||
                question.correctOptionIndex > 3) {
                throw new Error(`Question ${i + 1} has invalid correctOptionIndex`);
            }
            if (typeof question.explanation !== 'string' ||
                !question.explanation.trim()) {
                throw new Error(`Question ${i + 1} has invalid explanation`);
            }
        }
    }
    normalizeText(value) {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    transformQuestions(aiQuestions, context) {
        return aiQuestions.map((question, index) => {
            const questionId = this.createQuestionId();
            const options = question.options.map((option, optionIndex) => ({
                id: `${questionId}-option-${optionIndex + 1}`,
                text: option.text.trim(),
            }));
            const correctOptionId = options[question.correctOptionIndex]?.id;
            if (!correctOptionId) {
                throw new Error(`Invalid correct option for question ${index + 1}`);
            }
            const timeLimitSeconds = this.getTimeLimit(context.difficulty);
            const points = this.getPoints(context.difficulty);
            return {
                id: questionId,
                index,
                type: 'MCQ',
                difficulty: context.difficulty,
                topic: context.topic,
                question: question.question.trim(),
                media: null,
                options,
                correctOptionId,
                points,
                timeLimitSeconds,
                status: 'PENDING',
                startedAt: undefined,
                endsAt: undefined,
                explanation: question.explanation.trim(),
                stats: {
                    totalAnswered: 0,
                    correctCount: 0,
                    optionDistribution: Object.fromEntries(options.map((option) => [option.id, 0])),
                },
            };
        });
    }
    getTimeLimit(difficulty) {
        switch (difficulty.toUpperCase()) {
            case 'EASY':
                return 15;
            case 'MEDIUM':
                return 20;
            case 'HARD':
                return 30;
            default:
                return 20;
        }
    }
    getPoints(difficulty) {
        switch (difficulty.toUpperCase()) {
            case 'EASY':
                return 10;
            case 'MEDIUM':
                return 20;
            case 'HARD':
                return 30;
            default:
                return 10;
        }
    }
    normalizeQuestionCount(count) {
        if (!Number.isFinite(count)) {
            return 5;
        }
        return Math.min(Math.max(Math.floor(count), 1), 50);
    }
    normalizeDifficulty(difficulty) {
        const normalized = difficulty?.trim().toUpperCase();
        if (['EASY', 'MEDIUM', 'HARD'].includes(normalized)) {
            return normalized;
        }
        return 'MEDIUM';
    }
    parseNumber(value, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return fallback;
        }
        return parsed;
    }
    createQuestionId() {
        return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
};
exports.QuizBattleQuestionService = QuizBattleQuestionService;
exports.QuizBattleQuestionService = QuizBattleQuestionService = QuizBattleQuestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], QuizBattleQuestionService);


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("@google/genai");

/***/ }),
/* 20 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleRankingService = void 0;
const common_1 = __webpack_require__(3);
let QuizBattleRankingService = class QuizBattleRankingService {
    updateRanking(session) {
        const users = [...session.users.values()]
            .filter((user) => user.status !== 'LEFT')
            .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (b.correctAnswers !== a.correctAnswers) {
                return b.correctAnswers - a.correctAnswers;
            }
            if (b.answeredQuestions !== a.answeredQuestions) {
                return b.answeredQuestions - a.answeredQuestions;
            }
            return a.joinedAt - b.joinedAt;
        });
        const rankings = users.map((user, index) => {
            user.rank = index + 1;
            return {
                userId: user.userId,
                username: user.username,
                avatar: user.avatar,
                avatarId: user.avatarId,
                score: user.score,
                correctAnswers: user.correctAnswers,
                answeredQuestions: user.answeredQuestions,
                rank: user.rank,
                status: user.status,
            };
        });
        session.ranking = {
            roomId: session.room.roomId,
            rankings,
            updatedAt: Date.now(),
        };
    }
    getRanking(session) {
        return session.ranking;
    }
};
exports.QuizBattleRankingService = QuizBattleRankingService;
exports.QuizBattleRankingService = QuizBattleRankingService = __decorate([
    (0, common_1.Injectable)()
], QuizBattleRankingService);


/***/ }),
/* 21 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PlayerGameStateService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerGameStateService = void 0;
const common_1 = __webpack_require__(3);
const redis_1 = __webpack_require__(6);
let PlayerGameStateService = PlayerGameStateService_1 = class PlayerGameStateService {
    redisService;
    logger = new common_1.Logger(PlayerGameStateService_1.name);
    KEY = 'game:players:room';
    constructor(redisService) {
        this.redisService = redisService;
    }
    async enterGame(userId, roomId) {
        const existingRoomId = await this.getRoomId(userId);
        if (existingRoomId === roomId) {
            return true;
        }
        if (existingRoomId) {
            return false;
        }
        await this.redisService.client.hset(this.KEY, userId, roomId);
        return true;
    }
    async startGame(roomId, gameDuration = 1000 * 60 * 10) {
        const key = `game:room:${roomId}:expiration`;
        const result = await this.redisService.client.set(key, Date.now().toString(), 'PX', gameDuration, 'NX');
        return result === 'OK';
    }
    async getRoomId(userId) {
        return this.redisService.client.hget(this.KEY, userId);
    }
    async isInGame(userId) {
        const roomId = await this.getRoomId(userId);
        return roomId !== null;
    }
    async leaveGame(userId) {
        const removed = await this.redisService.client.hdel(this.KEY, userId);
        return removed === 1;
    }
    async getAllPlayers() {
        return this.redisService.client.hgetall(this.KEY);
    }
    async getPlayersInRoom(roomId) {
        const players = await this.getAllPlayers();
        return Object.entries(players)
            .filter(([, playerRoomId]) => playerRoomId === roomId)
            .map(([userId]) => userId);
    }
};
exports.PlayerGameStateService = PlayerGameStateService;
exports.PlayerGameStateService = PlayerGameStateService = PlayerGameStateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisService !== "undefined" && redis_1.RedisService) === "function" ? _a : Object])
], PlayerGameStateService);


/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsGateway_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsGateway = void 0;
const websockets_1 = __webpack_require__(23);
const common_1 = __webpack_require__(3);
const socket_io_1 = __webpack_require__(24);
const events_service_1 = __webpack_require__(25);
const quiz_battle_service_service_1 = __webpack_require__(5);
let EventsGateway = EventsGateway_1 = class EventsGateway {
    eventsService;
    quizBattleService;
    logger = new common_1.Logger(EventsGateway_1.name);
    server;
    constructor(eventsService, quizBattleService) {
        this.eventsService = eventsService;
        this.quizBattleService = quizBattleService;
    }
    afterInit(server) {
        this.eventsService.setSocket(server);
        this.logger.log('Socket.IO server initialized');
    }
    async handleError(message, client) {
        this.server.to(client.id).emit('battle:error', {
            success: false,
            message: message,
        });
    }
    async handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        try {
            const user = this.eventsService.extractUserFromSocket(client);
            if (!user) {
                this.handleError(`Invalid user information for client: ${client.id}`, client);
                client.disconnect(true);
                return;
            }
            await this.eventsService.registerSocket(client, user);
            client.emit('connected', {
                success: true,
                socketId: client.id,
                userId: user.id,
            });
            await this.quizBattleService.checkReconnectGame(user.id, Date.now(), (state) => {
                client.emit('battle:reconnect-response', state);
            }, (errorMessage) => {
                this.handleError(errorMessage, client);
            });
            this.logger.log(`User connected | ${user.username} | ${user.id} | ${client.id}`);
        }
        catch (error) {
            this.logger.error(`Connection failed | ${client.id}`, error instanceof Error ? error.stack : String(error));
            client.disconnect(true);
        }
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        await this.eventsService.unregisterSocket(client);
    }
    async sendErrorAll() {
        this.server.emit('battle:error', {
            success: false,
            message: 'An error occurred while processing the request',
        });
    }
    handleCreateRoom(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while creating the room`, client);
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
                prompt: '',
                host: {
                    userId: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    avatarId: user.avatarId,
                },
                numberOfQuestions: data.questionCount,
                totalTimeSeconds: data.secondsPerQuestion * data.questionCount,
            }, (state) => {
                this.server.to(client.id).emit('battle:lobby', state);
            }, (errorMessage) => {
                this.handleError(errorMessage, client);
            });
        }, 1000);
    }
    handleJoinRoom(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError('An error occurred while joining the room', client);
            return;
        }
        this.quizBattleService.joinRoom(data.roomId, {
            userId: user?.id,
            username: user?.username,
            avatar: user?.avatar,
            avatarId: user?.avatarId,
        }, async (state) => {
            const socketIds = (await this.eventsService.findSocketIdsByUserIds(state.players.map((p) => p.userId))).filter((id) => id !== user.id);
            this.server.to(socketIds).emit('battle:lobby', state);
            client.emit('battle:joined-response', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
    handleReady(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while setting ready status`, client);
            return;
        }
        this.quizBattleService.setPlayerReady({
            roomId: data.roomId,
            userId: user.id,
            ready: data.ready,
        }, async (state) => {
            const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map((p) => p.userId));
            this.server.to(socketIds).emit('battle:lobby-updated', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
    handleStart(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while starting the match`, client);
            return;
        }
        this.quizBattleService.startMatch({
            roomId: data.roomId,
            userId: user.id,
        }, async (state) => {
            const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map((p) => p.userId));
            this.server.to(socketIds).emit('battle:game-start', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
    handleLeave(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while leaving the match`, client);
            return;
        }
        this.quizBattleService.leaveRoom({
            roomId: data.roomId,
            userId: user.id,
        }, async (state) => {
            const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map((player) => player.userId));
            this.server.to(socketIds).emit('battle:player-left', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
    handleReconnect(client) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while reconnecting`, client);
            return;
        }
        this.quizBattleService.reconnectGame(user.id, Date.now(), (state) => {
            client.emit('battle:game-start', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
    handleAnswer(client, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            this.handleError(`An error occurred while submitting an answer`, client);
            return;
        }
        this.quizBattleService.answerAttempt({
            roomId: data.roomId,
            userId: user.id,
            qId: data.qId,
            oId: data.oId,
        }, async (state) => {
            const socketIds = await this.eventsService.findSocketIdsByUserIds(state.players.map((player) => player.userId));
            this.server.to(socketIds).emit('battle:lobby-updated', state);
        }, (errorMessage) => {
            this.handleError(errorMessage, client);
        });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_c = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _c : Object)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('test:error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], EventsGateway.prototype, "sendErrorAll", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:create'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:ready'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:game-start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _j : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:reconnect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _k : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleReconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _l : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleAnswer", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/event',
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket'],
    }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    })),
    __metadata("design:paramtypes", [typeof (_a = typeof events_service_1.EventsService !== "undefined" && events_service_1.EventsService) === "function" ? _a : Object, typeof (_b = typeof quiz_battle_service_service_1.QuizBattleService !== "undefined" && quiz_battle_service_service_1.QuizBattleService) === "function" ? _b : Object])
], EventsGateway);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),
/* 25 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsService = void 0;
const redis_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
let EventsService = EventsService_1 = class EventsService {
    redisService;
    logger = new common_1.Logger(EventsService_1.name);
    server;
    socketKey = 'SOCKET:CLIENTS';
    constructor(redisService) {
        this.redisService = redisService;
    }
    setSocket(server) {
        this.server = server;
        this.logger.log('Socket.IO server registered in EventsService');
    }
    extractUserFromSocket(client) {
        const { id, username, avatar, avatarId } = client.handshake.query;
        if (typeof id !== 'string' || !id.trim()) {
            this.logger.warn(`Missing user id | socket=${client.id}`);
            return null;
        }
        if (typeof username !== 'string' || !username.trim()) {
            this.logger.warn(`Missing username | socket=${client.id}`);
            return null;
        }
        return {
            id,
            username,
            avatar: typeof avatar === 'string' ? avatar : undefined,
            avatarId: typeof avatarId === 'string' ? avatarId : undefined,
        };
    }
    async registerSocket(client, user) {
        await this.redisService.client.hset(this.socketKey, user.id, client.id);
        this.logger.log(`Redis socket registered | user=${user.id} socket=${client.id}`);
    }
    async unregisterSocket(client) {
        const user = this.extractUserFromSocket(client);
        if (!user) {
            return;
        }
        const currentSocketId = await this.redisService.client.hget(this.socketKey, user.id);
        if (currentSocketId !== client.id) {
            this.logger.debug(`Skipping Redis cleanup because socket was replaced | user=${user.id}`);
            return;
        }
        await this.redisService.client.hdel(this.socketKey, user.id);
        this.logger.log(`Redis socket removed | user=${user.id} socket=${client.id}`);
    }
    async getSocketIdByUserId(userId) {
        if (typeof userId !== 'string' || !userId.trim()) {
            return null;
        }
        const socketId = await this.redisService.client.hget(this.socketKey, userId);
        return socketId ?? null;
    }
    async findSocketIdsByUserIds(userIds) {
        if (!userIds?.length) {
            return [];
        }
        const uniqueUserIds = [
            ...new Set(userIds.filter((id) => typeof id === 'string' && id.trim().length > 0)),
        ];
        if (!uniqueUserIds.length) {
            return [];
        }
        const socketIds = await Promise.all(uniqueUserIds.map((userId) => this.redisService.client.hget(this.socketKey, userId)));
        return socketIds.filter((socketId) => typeof socketId === 'string' && socketId.length > 0);
    }
    async sendMessageToUsers(userIds, data) {
        if (!this.server) {
            this.logger.warn('Socket.IO server is not initialized');
            return;
        }
        const socketIds = await this.findSocketIdsByUserIds(userIds);
        if (!socketIds.length) {
            this.logger.debug(`No online users found for message`);
            return;
        }
        this.server.to(socketIds).emit('message-activity', {
            message: data.message,
            senderSocketId: data.senderSocketId,
        });
        this.logger.debug(`Message sent to ${socketIds.length} socket(s)`);
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisService !== "undefined" && redis_1.RedisService) === "function" ? _a : Object])
], EventsService);


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = __webpack_require__(27);
const redis_adapter_1 = __webpack_require__(28);
const redis_1 = __webpack_require__(29);
const common_1 = __webpack_require__(3);
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    logger = new common_1.Logger(RedisIoAdapter.name);
    adapterConstructor;
    pubClient;
    subClient;
    async connectToRedis() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL is not defined');
        }
        this.pubClient = (0, redis_1.createClient)({
            url: redisUrl,
        });
        this.subClient = this.pubClient.duplicate();
        this.pubClient.on('error', (error) => {
            this.logger.error('[Redis Pub] Error:', error);
        });
        this.subClient.on('error', (error) => {
            this.logger.error('[Redis Sub] Error:', error);
        });
        await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
        this.adapterConstructor = (0, redis_adapter_1.createAdapter)(this.pubClient, this.subClient);
        this.logger.log('Redis Socket.IO adapter connected');
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        if (!this.adapterConstructor) {
            throw new Error('Redis adapter is not initialized');
        }
        server.adapter(this.adapterConstructor);
        return server;
    }
    async close() {
        await Promise.all([this.pubClient?.quit(), this.subClient?.quit()]);
    }
}
exports.RedisIoAdapter = RedisIoAdapter;


/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("@nestjs/platform-socket.io");

/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("@socket.io/redis-adapter");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("redis");

/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("@nestjs/common/services");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const quiz_battle_service_module_1 = __webpack_require__(2);
const RedisIoAdapter_1 = __webpack_require__(26);
const services_1 = __webpack_require__(30);
async function bootstrap() {
    const app = await core_1.NestFactory.create(quiz_battle_service_module_1.QuizBattleServiceModule);
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const redisIoAdapter = new RedisIoAdapter_1.RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    const port = Number(process.env.PORT) || 5000;
    await app.listen(port, '0.0.0.0');
    services_1.Logger.log(`QuizBattle service running on port ${port}`);
}
bootstrap();

})();

/******/ })()
;