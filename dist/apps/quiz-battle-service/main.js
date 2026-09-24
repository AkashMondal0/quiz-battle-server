/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/quiz-battle-service/src/events/RedisIoAdapter.ts"
/*!***************************************************************!*\
  !*** ./apps/quiz-battle-service/src/events/RedisIoAdapter.ts ***!
  \***************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = __webpack_require__(/*! @nestjs/platform-socket.io */ "@nestjs/platform-socket.io");
const redis_adapter_1 = __webpack_require__(/*! @socket.io/redis-adapter */ "@socket.io/redis-adapter");
const redis_1 = __webpack_require__(/*! redis */ "redis");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
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


/***/ },

/***/ "./apps/quiz-battle-service/src/events/events.gateway.ts"
/*!***************************************************************!*\
  !*** ./apps/quiz-battle-service/src/events/events.gateway.ts ***!
  \***************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsGateway = void 0;
const websockets_1 = __webpack_require__(/*! @nestjs/websockets */ "@nestjs/websockets");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const socket_io_1 = __webpack_require__(/*! socket.io */ "socket.io");
const events_service_1 = __webpack_require__(/*! ./events.service */ "./apps/quiz-battle-service/src/events/events.service.ts");
const quiz_battle_service_service_1 = __webpack_require__(/*! ../quiz-battle-service.service */ "./apps/quiz-battle-service/src/quiz-battle-service.service.ts");
const battle_dto_1 = __webpack_require__(/*! ../interface/battle.dto */ "./apps/quiz-battle-service/src/interface/battle.dto.ts");
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
        const rootServer = server.server ?? server;
        const engine = rootServer?.engine;
        if (engine?.on) {
            engine.on('connection_error', (err) => {
                this.logger.warn(`WebSocket connection error | code=${err?.code} message=${err?.message} context=${JSON.stringify(err?.context ?? {})}`);
            });
        }
        else {
            this.logger.warn('Could not attach engine.io connection_error listener (engine not found on server instance)');
        }
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
        client.on('error', (err) => {
            this.logger.warn(`Socket error | socket=${client.id} | ${err instanceof Error ? err.message : String(err)}`);
        });
        try {
            const user = this.eventsService.extractUserFromSocket(client);
            if (!user) {
                await this.handleError(`Invalid user information for client: ${client.id}`, client);
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
        const user = this.eventsService.extractUserFromSocket(client);
        await this.eventsService.unregisterSocket(client);
        if (!user)
            return;
        await this.quizBattleService.handleSocketDisconnect(user.id);
    }
    handleCreateRoom(client, ack, data) {
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
            client.emit('battle:lobby', state);
            ack({
                success: true,
                status: 'CREATED',
                message: 'Room created successfully',
                requestId: data.requestId,
                serverTime: Date.now(),
            });
        }, (errorMessage) => {
            ack({
                success: false,
                status: 'SERVER_ERROR',
                message: errorMessage,
                requestId: data.requestId,
                serverTime: Date.now(),
            });
        });
    }
    handleJoinRoom(client, ack, data) {
        const user = this.eventsService.extractUserFromSocket(client);
        const requestId = data.requestId ?? this.eventsService.generateRequestId();
        if (!user) {
            this.logger.warn(`Invalid user information for client: ${client.id}`);
            ack({
                success: false,
                status: 'NOT_FOUND',
                message: 'An error occurred while joining the room',
                requestId: requestId,
                serverTime: Date.now(),
            });
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
            ack({
                success: true,
                status: 'OK',
                message: 'Joined room successfully',
                requestId: requestId,
                serverTime: Date.now(),
            });
        }, (errorMessage) => {
            ack({
                success: false,
                status: 'SERVER_ERROR',
                message: errorMessage,
                requestId: requestId,
                serverTime: Date.now(),
            });
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
    (0, websockets_1.SubscribeMessage)('battle:create'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.Ack)()),
    __param(2, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _d : Object, Function, typeof (_e = typeof battle_dto_1.CreateRoomDto !== "undefined" && battle_dto_1.CreateRoomDto) === "function" ? _e : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.Ack)()),
    __param(2, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _f : Object, Function, typeof (_g = typeof battle_dto_1.JoinRoomDto !== "undefined" && battle_dto_1.JoinRoomDto) === "function" ? _g : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:ready'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _h : Object, typeof (_j = typeof battle_dto_1.ReadyDto !== "undefined" && battle_dto_1.ReadyDto) === "function" ? _j : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:game-start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _k : Object, typeof (_l = typeof battle_dto_1.RoomIdDto !== "undefined" && battle_dto_1.RoomIdDto) === "function" ? _l : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _m : Object, typeof (_o = typeof battle_dto_1.RoomIdDto !== "undefined" && battle_dto_1.RoomIdDto) === "function" ? _o : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:reconnect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _p : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleReconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('battle:answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _q : Object, typeof (_r = typeof battle_dto_1.AnswerDto !== "undefined" && battle_dto_1.AnswerDto) === "function" ? _r : Object]),
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
        pingInterval: 25000,
        pingTimeout: 20000,
        connectTimeout: 15000,
    }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    })),
    __metadata("design:paramtypes", [typeof (_a = typeof events_service_1.EventsService !== "undefined" && events_service_1.EventsService) === "function" ? _a : Object, typeof (_b = typeof quiz_battle_service_service_1.QuizBattleService !== "undefined" && quiz_battle_service_service_1.QuizBattleService) === "function" ? _b : Object])
], EventsGateway);


/***/ },

/***/ "./apps/quiz-battle-service/src/events/events.service.ts"
/*!***************************************************************!*\
  !*** ./apps/quiz-battle-service/src/events/events.service.ts ***!
  \***************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
const redis_1 = __webpack_require__(/*! @app/redis */ "./libs/redis/src/index.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
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
    async emitToUsers(userIds, event, payload) {
        if (!this.server) {
            this.logger.warn('Socket.IO server is not initialized');
            return;
        }
        const socketIds = await this.findSocketIdsByUserIds(userIds);
        if (!socketIds.length) {
            this.logger.debug(`No online users found for event "${event}"`);
            return;
        }
        this.server.to(socketIds).emit(event, payload);
    }
    generateRequestId() {
        const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        return requestId;
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisService !== "undefined" && redis_1.RedisService) === "function" ? _a : Object])
], EventsService);


/***/ },

/***/ "./apps/quiz-battle-service/src/interface/battle.dto.ts"
/*!**************************************************************!*\
  !*** ./apps/quiz-battle-service/src/interface/battle.dto.ts ***!
  \**************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnswerDto = exports.RoomIdDto = exports.ReadyDto = exports.JoinRoomDto = exports.CreateRoomDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateRoomDto {
    requestId;
    topic;
    aiModelId;
    aiBackendId;
    gameMode;
    playerCount;
    difficulty;
    questionCount;
    secondsPerQuestion;
    isPrivate;
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "aiModelId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "aiBackendId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "gameMode", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "playerCount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "questionCount", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "secondsPerQuestion", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRoomDto.prototype, "isPrivate", void 0);
class JoinRoomDto {
    roomId;
    requestId;
}
exports.JoinRoomDto = JoinRoomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], JoinRoomDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinRoomDto.prototype, "requestId", void 0);
class ReadyDto {
    ready;
    roomId;
}
exports.ReadyDto = ReadyDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReadyDto.prototype, "ready", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ReadyDto.prototype, "roomId", void 0);
class RoomIdDto {
    roomId;
}
exports.RoomIdDto = RoomIdDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], RoomIdDto.prototype, "roomId", void 0);
class AnswerDto {
    roomId;
    oId;
    qId;
}
exports.AnswerDto = AnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AnswerDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AnswerDto.prototype, "oId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AnswerDto.prototype, "qId", void 0);


/***/ },

/***/ "./apps/quiz-battle-service/src/quiz-battle-service.controller.ts"
/*!************************************************************************!*\
  !*** ./apps/quiz-battle-service/src/quiz-battle-service.controller.ts ***!
  \************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const quiz_battle_service_service_1 = __webpack_require__(/*! ./quiz-battle-service.service */ "./apps/quiz-battle-service/src/quiz-battle-service.service.ts");
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


/***/ },

/***/ "./apps/quiz-battle-service/src/quiz-battle-service.module.ts"
/*!********************************************************************!*\
  !*** ./apps/quiz-battle-service/src/quiz-battle-service.module.ts ***!
  \********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleServiceModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const quiz_battle_service_controller_1 = __webpack_require__(/*! ./quiz-battle-service.controller */ "./apps/quiz-battle-service/src/quiz-battle-service.controller.ts");
const quiz_battle_service_service_1 = __webpack_require__(/*! ./quiz-battle-service.service */ "./apps/quiz-battle-service/src/quiz-battle-service.service.ts");
const config_1 = __webpack_require__(/*! @app/config */ "./libs/config/src/index.ts");
const redis_1 = __webpack_require__(/*! @app/redis */ "./libs/redis/src/index.ts");
const events_gateway_1 = __webpack_require__(/*! ./events/events.gateway */ "./apps/quiz-battle-service/src/events/events.gateway.ts");
const quiz_battle_question_service_1 = __webpack_require__(/*! ./services/quiz-battle-question.service */ "./apps/quiz-battle-service/src/services/quiz-battle-question.service.ts");
const quiz_battle_ranking_service_1 = __webpack_require__(/*! ./services/quiz-battle-ranking.service */ "./apps/quiz-battle-service/src/services/quiz-battle-ranking.service.ts");
const events_service_1 = __webpack_require__(/*! ./events/events.service */ "./apps/quiz-battle-service/src/events/events.service.ts");
const player_game_state_service_1 = __webpack_require__(/*! ./services/player.game.state.service */ "./apps/quiz-battle-service/src/services/player.game.state.service.ts");
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


/***/ },

/***/ "./apps/quiz-battle-service/src/quiz-battle-service.service.ts"
/*!*********************************************************************!*\
  !*** ./apps/quiz-battle-service/src/quiz-battle-service.service.ts ***!
  \*********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_1 = __webpack_require__(/*! @app/redis */ "./libs/redis/src/index.ts");
const quiz_battle_question_service_1 = __webpack_require__(/*! ./services/quiz-battle-question.service */ "./apps/quiz-battle-service/src/services/quiz-battle-question.service.ts");
const quiz_battle_ranking_service_1 = __webpack_require__(/*! ./services/quiz-battle-ranking.service */ "./apps/quiz-battle-service/src/services/quiz-battle-ranking.service.ts");
const player_game_state_service_1 = __webpack_require__(/*! ./services/player.game.state.service */ "./apps/quiz-battle-service/src/services/player.game.state.service.ts");
const events_service_1 = __webpack_require__(/*! ./events/events.service */ "./apps/quiz-battle-service/src/events/events.service.ts");
let QuizBattleService = QuizBattleService_1 = class QuizBattleService {
    redisService;
    questionService;
    rankingService;
    playerGameStateService;
    eventsService;
    logger = new common_1.Logger(QuizBattleService_1.name);
    sessions = new Map();
    reconnectGracePeriod = 10 * 60 * 1000;
    subscriber = null;
    disconnectTimers = new Map();
    constructor(redisService, questionService, rankingService, playerGameStateService, eventsService) {
        this.redisService = redisService;
        this.questionService = questionService;
        this.rankingService = rankingService;
        this.playerGameStateService = playerGameStateService;
        this.eventsService = eventsService;
    }
    async onModuleInit() {
        this.subscriber = this.redisService.client.duplicate();
        this.subscriber.on('error', (err) => {
            this.logger.error('Redis subscriber error', err instanceof Error ? err.stack : String(err));
        });
        try {
            await this.redisService.client.config('SET', 'notify-keyspace-events', 'Ex');
        }
        catch (error) {
            this.logger.warn('Could not set notify-keyspace-events on Redis (may be disabled for managed/cluster instances). ' +
                'Ensure it is configured out of band: CONFIG SET notify-keyspace-events Ex', error instanceof Error ? error.stack : String(error));
        }
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
        if (session.room.status === 'FINISHED') {
            this.sessions.delete(roomId);
            return;
        }
        await this.finishMatch(session);
        for (const [key, timer] of this.disconnectTimers.entries()) {
            if (key.startsWith(`${roomId}:`)) {
                clearTimeout(timer);
                this.disconnectTimers.delete(key);
            }
        }
        this.sessions.delete(roomId);
        this.logger.debug(`Room finished & cleaned up | room=${roomId}`);
    }
    async handleSocketDisconnect(userId) {
        try {
            const roomId = await this.playerGameStateService.getRoomId(userId);
            if (!roomId)
                return;
            const session = await this.getRoom(roomId);
            if (!session)
                return;
            if (session.room.status === 'FINISHED')
                return;
            const publicUser = await this.disconnectUser(roomId, userId);
            if (!publicUser)
                return;
            const state = this.createRoomState(session);
            const remainingUserIds = [...session.users.values()]
                .filter((u) => u.userId !== userId && u.status !== 'LEFT')
                .map((u) => u.userId);
            await this.broadcastToRoom(remainingUserIds, 'battle:player-disconnected', state);
        }
        catch (error) {
            this.logger.error(`Error handling socket disconnect | user=${userId}`, error instanceof Error ? error.stack : String(error));
        }
    }
    async checkReconnectGame(userId, _clientTime, socketCallbackWithRoomState, onError) {
        try {
            const state = await this.getReconnectState(userId);
            if (state) {
                socketCallbackWithRoomState(state);
            }
        }
        catch (error) {
            this.logger.error(`Reconnect check failed | user=${userId}`, error instanceof Error ? error.stack : String(error));
            onError?.('Failed to check reconnect state');
        }
    }
    async reconnectGame(userId, _clientTime, socketCallbackWithRoomState, errorCallback) {
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
        }
        catch (error) {
            this.logger.error(`Reconnect failed | user=${userId}`, error instanceof Error ? error.stack : String(error));
            errorCallback('Failed to reconnect');
        }
    }
    async getReconnectState(userId) {
        const roomId = await this.playerGameStateService.getRoomId(userId);
        if (!roomId)
            return null;
        const session = await this.getRoom(roomId);
        if (!session) {
            this.logger.error(`User ${userId} trying to reconnect to a non-existent room ${roomId}`);
            await this.playerGameStateService.leaveGame(userId);
            return null;
        }
        if (session.room.status === 'FINISHED') {
            return this.createRoomState(session, userId);
        }
        if (await this.isRoomExpired(session)) {
            this.logger.warn(`User ${userId} reconnecting to expired room ${roomId}; finalizing`);
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
                count: room.numberOfQuestions,
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
            void this.advanceQuestion(roomId);
            return;
        }
        catch (error) {
            this.logger.error('Error starting room', error instanceof Error ? error.stack : String(error));
            onError?.('Failed to start match');
            return;
        }
    }
    getPerQuestionDurationMs(room) {
        const total = room.totalTimeSeconds || 600;
        const count = room.numberOfQuestions || 1;
        const perQuestionSeconds = Math.max(5, Math.floor(total / count));
        return perQuestionSeconds * 1000;
    }
    async advanceQuestion(roomId) {
        const session = await this.getRoom(roomId);
        if (!session)
            return;
        if (session.room.status !== 'PLAYING')
            return;
        if (session.timer) {
            clearTimeout(session.timer);
            session.timer = undefined;
        }
        const nextIndex = session.room.currentQuestionIndex + 1;
        if (nextIndex >= session.questions.length) {
            await this.finishMatch(session);
            return;
        }
        const question = session.questions[nextIndex];
        const durationMs = this.getPerQuestionDurationMs(session.room);
        const now = Date.now();
        session.room.currentQuestionIndex = nextIndex;
        session.room.currentQuestionId = question.id;
        session.room.questionStartedAt = now;
        session.room.questionEndsAt = now + durationMs;
        for (const player of session.users.values()) {
            player.hasAnsweredCurrentQuestion = false;
        }
        await this.saveSessionToRedis(session);
        const activeUserIds = [...session.users.values()]
            .filter((u) => u.status !== 'LEFT')
            .map((u) => u.userId);
        await this.broadcastToRoom(activeUserIds, 'battle:question', this.createRoomState(session));
        session.timer = setTimeout(() => {
            void this.advanceQuestion(roomId);
        }, durationMs);
        if (typeof session.timer.unref === 'function') {
            session.timer.unref();
        }
    }
    async finishMatch(session) {
        if (session.room.status === 'FINISHED')
            return;
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
        await Promise.all(players.map((player) => this.playerGameStateService.leaveGame(player.userId)));
        const userIds = players.map((p) => p.userId);
        await this.broadcastToRoom(userIds, 'battle:finished', this.createRoomState(session));
    }
    async broadcastToRoom(userIds, event, payload) {
        if (!userIds.length)
            return;
        await this.eventsService.emitToUsers(userIds, event, payload);
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
            await this.playerGameStateService.leaveGame(userId);
            const activeRemaining = [...session.users.values()].filter((u) => u.status !== 'LEFT');
            if (session.room.status === 'PLAYING' && activeRemaining.length === 0) {
                await this.finishMatch(session);
                socketCallbackWithRoomState(this.createRoomState(session));
                return;
            }
            this.rankingService.updateRanking(session);
            await this.saveSessionToRedis(session);
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
            if (questionIndex !== session.room.currentQuestionIndex) {
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
            const activePlayers = [...session.users.values()].filter((p) => p.status !== 'LEFT');
            const allAnswered = activePlayers.length > 0 &&
                activePlayers.every((p) => p.hasAnsweredCurrentQuestion);
            if (allAnswered) {
                void this.advanceQuestion(roomId);
            }
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
        await this.playerGameStateService.leaveGame(userId);
        this.rankingService.updateRanking(session);
        await this.saveSessionToRedis(session);
        const activeRemaining = [...session.users.values()].filter((u) => u.status !== 'LEFT');
        if (session.room.status === 'PLAYING' && activeRemaining.length === 0) {
            await this.finishMatch(session);
            return;
        }
        const remainingUserIds = activeRemaining.map((u) => u.userId);
        await this.broadcastToRoom(remainingUserIds, 'battle:player-left', this.createRoomState(session));
    }
    async isRoomExpired(session) {
        const status = session.room.status;
        if (status === 'WAITING' || status === 'COUNTDOWN') {
            return false;
        }
        const exists = await this.redisService.client.exists(`game:room:${session.room.roomId}:expiration`);
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
};
exports.QuizBattleService = QuizBattleService;
exports.QuizBattleService = QuizBattleService = QuizBattleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisService !== "undefined" && redis_1.RedisService) === "function" ? _a : Object, typeof (_b = typeof quiz_battle_question_service_1.QuizBattleQuestionService !== "undefined" && quiz_battle_question_service_1.QuizBattleQuestionService) === "function" ? _b : Object, typeof (_c = typeof quiz_battle_ranking_service_1.QuizBattleRankingService !== "undefined" && quiz_battle_ranking_service_1.QuizBattleRankingService) === "function" ? _c : Object, typeof (_d = typeof player_game_state_service_1.PlayerGameStateService !== "undefined" && player_game_state_service_1.PlayerGameStateService) === "function" ? _d : Object, typeof (_e = typeof events_service_1.EventsService !== "undefined" && events_service_1.EventsService) === "function" ? _e : Object])
], QuizBattleService);


/***/ },

/***/ "./apps/quiz-battle-service/src/services/player.game.state.service.ts"
/*!****************************************************************************!*\
  !*** ./apps/quiz-battle-service/src/services/player.game.state.service.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_1 = __webpack_require__(/*! @app/redis */ "./libs/redis/src/index.ts");
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


/***/ },

/***/ "./apps/quiz-battle-service/src/services/quiz-battle-question.service.ts"
/*!*******************************************************************************!*\
  !*** ./apps/quiz-battle-service/src/services/quiz-battle-question.service.ts ***!
  \*******************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
var QuizBattleQuestionService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleQuestionService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const openai_1 = __importDefault(__webpack_require__(/*! openai */ "openai"));
let QuizBattleQuestionService = QuizBattleQuestionService_1 = class QuizBattleQuestionService {
    logger = new common_1.Logger(QuizBattleQuestionService_1.name);
    ai;
    model;
    maxRetries;
    timeoutMs;
    constructor() {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }
        this.model =
            process.env.OPENROUTER_MODEL ||
                'google/gemma-3-27b-it:free';
        this.maxRetries = Math.max(1, Number(process.env.OPENROUTER_MAX_RETRIES || 2));
        this.timeoutMs = Math.max(10_000, Number(process.env.OPENROUTER_TIMEOUT_MS || 60_000));
        this.ai = new openai_1.default({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://quizbattle.app',
                'X-Title': 'QuizBattle',
            },
        });
        this.logger.log(`OpenRouter initialized | model=${this.model} | retries=${this.maxRetries} | timeout=${this.timeoutMs}ms`);
    }
    async generateQuestions(options = {}, room) {
        const count = this.normalizeCount(options.count);
        const difficulty = this.normalizeDifficulty(options.difficulty);
        const topic = this.cleanText(options.topic) ||
            'General Knowledge';
        const prompt = this.cleanText(options.prompt) || '';
        const mode = this.cleanText(options.mode) ||
            'STANDARD';
        this.logger.log(`Generating quiz | count=${count} | difficulty=${difficulty} | topic="${topic}" | mode="${mode}"`);
        try {
            const questions = await this.createDummyQuestions();
            if (questions.length !== count) {
                throw new Error(`Expected ${count} questions but received ${questions.length}`);
            }
            this.logger.log(`Successfully generated ${questions.length} questions`);
            return questions;
        }
        catch (error) {
            this.logger.error('OpenRouter quiz generation failed', error instanceof Error
                ? error.stack
                : String(error));
            throw new common_1.InternalServerErrorException('Unable to generate quiz questions right now. Please try again.');
        }
    }
    async requestQuestionsFromAI(params) {
        const systemPrompt = this.buildSystemPrompt(params);
        const userPrompt = this.buildUserPrompt(params);
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.logger.log(`OpenRouter request attempt ${attempt}/${this.maxRetries}`);
                const response = await this.generateContentWithTimeout(systemPrompt, userPrompt);
                const modelUsed = response.model;
                const finishReason = response.choices?.[0]
                    ?.finish_reason;
                const message = response.choices?.[0]?.message;
                const content = typeof message?.content === 'string'
                    ? message.content
                    : '';
                this.logger.debug(`OpenRouter model used: ${modelUsed}`);
                this.logger.debug(`OpenRouter finish reason: ${finishReason}`);
                this.logger.debug(`OpenRouter response length: ${content.length}`);
                if (!content.trim()) {
                    throw new Error('OpenRouter returned an empty response');
                }
                if (content
                    .trim()
                    .toLowerCase()
                    .startsWith('user safety:')) {
                    throw new Error(`OpenRouter provider returned safety response instead of quiz JSON: ${content}`);
                }
                const jsonText = this.cleanJsonResponse(content);
                let parsed;
                try {
                    parsed = JSON.parse(jsonText);
                }
                catch (error) {
                    this.logger.error(`Invalid JSON returned by OpenRouter`);
                    this.logger.error(`Raw response: ${content}`);
                    throw new Error(`OpenRouter returned invalid JSON`);
                }
                this.validateAIResponse(parsed, params.count);
                return parsed;
            }
            catch (error) {
                lastError = error;
                const retryable = this.isRetryableError(error);
                this.logger.warn(`OpenRouter attempt ${attempt} failed | retryable=${retryable} | error=${error instanceof Error
                    ? error.message
                    : String(error)}`);
                if (!retryable ||
                    attempt >= this.maxRetries) {
                    break;
                }
                const delay = this.calculateBackoff(attempt);
                this.logger.warn(`Retrying OpenRouter request in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        throw lastError instanceof Error
            ? lastError
            : new Error(String(lastError));
    }
    async generateContentWithTimeout(systemPrompt, userPrompt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeoutMs);
        try {
            return await this.ai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 8000,
            }, {
                signal: controller.signal,
            });
        }
        catch (error) {
            if (error instanceof Error &&
                error.name === 'AbortError') {
                throw new Error(`OpenRouter request timed out after ${this.timeoutMs}ms`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    buildSystemPrompt(params) {
        return `
You are the QuizBattle AI question generator.

Generate high-quality multiple-choice questions.

STRICT OUTPUT RULE:

Return ONLY valid JSON.

Do NOT return markdown.
Do NOT return a code block.
Do NOT return explanations outside JSON.
Do NOT return any introductory text.
Do NOT return any text before or after the JSON.

The response MUST be directly parseable by JSON.parse().

The JSON MUST have exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctOptionIndex": 0,
      "explanation": "Short factual explanation."
    }
  ]
}

==================================================
REQUIREMENTS
==================================================

Generate EXACTLY ${params.count} questions.

Each question MUST have:

- question
- exactly 4 options
- correctOptionIndex
- explanation

correctOptionIndex MUST be:

0, 1, 2, or 3

There must be exactly ONE correct answer.

Do NOT use:

- All of the above
- None of the above
- Multiple correct answers
- Ambiguous answers
- Subjective answers
- Duplicate options
- Duplicate questions

==================================================
DIFFICULTY
==================================================

${params.difficulty}

EASY:
Simple/common knowledge.

MEDIUM:
Requires moderate knowledge or reasoning.

HARD:
Requires deeper knowledge.

==================================================
TOPIC
==================================================

${params.topic}

==================================================
GAME MODE
==================================================

${params.mode}

==================================================
QUESTION QUALITY
==================================================

Questions must be:

- factual
- clear
- unambiguous
- suitable for multiplayer quiz
- grammatically correct
- relevant to the topic

==================================================
FINAL RULE
==================================================

Return ONLY the JSON object.

No markdown.
No code fences.
No additional text.
`.trim();
    }
    buildUserPrompt(params) {
        return `
Generate ${params.count} ${params.difficulty} quiz questions.

Topic:
${params.topic}

Game mode:
${params.mode}

Additional instructions:
${params.prompt || 'None'}

Requirements:

- Exactly ${params.count} questions
- Exactly 4 options per question
- Exactly one correct option
- correctOptionIndex must be 0, 1, 2, or 3
- Every question must have an explanation
- No duplicate questions
- No duplicate options
- No "all of the above"
- No "none of the above"
- No markdown
- Return ONLY JSON

Return the JSON now.
`.trim();
    }
    cleanJsonResponse(content) {
        let text = content.trim();
        if (text.startsWith('```json')) {
            text = text.substring(7);
        }
        if (text.startsWith('```')) {
            text = text.substring(3);
        }
        if (text.endsWith('```')) {
            text = text.substring(0, text.length - 3);
        }
        text = text.trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 &&
            lastBrace !== -1 &&
            lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
        return text.trim();
    }
    validateAIResponse(response, expectedCount) {
        if (!response ||
            typeof response !== 'object') {
            throw new Error('AI response is not an object');
        }
        const data = response;
        if (!Array.isArray(data.questions)) {
            throw new Error('AI response does not contain questions array');
        }
        if (data.questions.length !==
            expectedCount) {
            throw new Error(`Expected ${expectedCount} questions but received ${data.questions.length}`);
        }
        const questionSet = new Set();
        data.questions.forEach((rawQuestion, index) => {
            if (!rawQuestion ||
                typeof rawQuestion !==
                    'object') {
                throw new Error(`Question ${index + 1} is invalid`);
            }
            const question = rawQuestion;
            if (typeof question.question !==
                'string' ||
                !question.question.trim()) {
                throw new Error(`Question ${index + 1} has invalid text`);
            }
            const normalizedQuestion = this.normalizeForDuplicateCheck(question.question);
            if (questionSet.has(normalizedQuestion)) {
                throw new Error(`Duplicate question detected: ${question.question}`);
            }
            questionSet.add(normalizedQuestion);
            if (!Array.isArray(question.options)) {
                throw new Error(`Question ${index + 1} has no options`);
            }
            if (question.options.length !== 4) {
                throw new Error(`Question ${index + 1} must have exactly 4 options`);
            }
            const optionSet = new Set();
            question.options.forEach((option, optionIndex) => {
                if (typeof option !==
                    'string' ||
                    !option.trim()) {
                    throw new Error(`Question ${index + 1} option ${optionIndex + 1} is invalid`);
                }
                const normalizedOption = this.normalizeForDuplicateCheck(option);
                if (optionSet.has(normalizedOption)) {
                    throw new Error(`Question ${index + 1} contains duplicate options`);
                }
                optionSet.add(normalizedOption);
            });
            if (typeof question.correctOptionIndex !==
                'number') {
                throw new Error(`Question ${index + 1} has invalid correctOptionIndex`);
            }
            if (!Number.isInteger(question.correctOptionIndex) ||
                question.correctOptionIndex <
                    0 ||
                question.correctOptionIndex >
                    3) {
                throw new Error(`Question ${index + 1} correctOptionIndex must be 0-3`);
            }
            if (typeof question.explanation !==
                'string' ||
                !question.explanation.trim()) {
                throw new Error(`Question ${index + 1} has invalid explanation`);
            }
        });
    }
    transformQuestions(aiQuestions, difficulty, topic) {
        return aiQuestions.map((aiQuestion, questionIndex) => {
            const options = aiQuestion.options.map((text, optionIndex) => ({
                id: this.generateOptionId(questionIndex, optionIndex),
                text: text.trim(),
            }));
            const correctOption = options[aiQuestion.correctOptionIndex];
            if (!correctOption) {
                throw new Error(`Invalid correct option for question ${questionIndex + 1}`);
            }
            const settings = this.getDifficultySettings(difficulty);
            const question = {
                id: this.generateQuestionId(questionIndex),
                index: questionIndex,
                type: 'MCQ',
                difficulty,
                topic,
                question: aiQuestion.question.trim(),
                media: null,
                options,
                correctOptionId: correctOption.id,
                points: settings.points,
                timeLimitSeconds: settings.timeLimitSeconds,
                status: 'WAITING',
                explanation: aiQuestion.explanation.trim(),
                stats: {
                    totalAnswered: 0,
                    correctCount: 0,
                    optionDistribution: options.reduce((distribution, option) => {
                        distribution[option.id] = 0;
                        return distribution;
                    }, {}),
                },
            };
            return question;
        });
    }
    getDifficultySettings(difficulty) {
        switch (difficulty) {
            case 'EASY':
                return {
                    points: 10,
                    timeLimitSeconds: 15,
                };
            case 'HARD':
                return {
                    points: 30,
                    timeLimitSeconds: 30,
                };
            case 'MEDIUM':
            default:
                return {
                    points: 20,
                    timeLimitSeconds: 20,
                };
        }
    }
    generateQuestionId(index) {
        return [
            'question',
            Date.now(),
            index,
            Math.random()
                .toString(36)
                .substring(2, 8),
        ].join('_');
    }
    generateOptionId(questionIndex, optionIndex) {
        return [
            'option',
            Date.now(),
            questionIndex,
            optionIndex,
            Math.random()
                .toString(36)
                .substring(2, 8),
        ].join('_');
    }
    normalizeCount(count) {
        if (typeof count !== 'number' ||
            !Number.isFinite(count)) {
            return 5;
        }
        return Math.min(50, Math.max(1, Math.floor(count)));
    }
    normalizeDifficulty(difficulty) {
        const value = difficulty
            ?.trim()
            .toUpperCase();
        if (value === 'EASY' ||
            value === 'MEDIUM' ||
            value === 'HARD') {
            return value;
        }
        return 'MEDIUM';
    }
    cleanText(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const result = value.trim();
        return result.length
            ? result
            : undefined;
    }
    normalizeForDuplicateCheck(value) {
        return value
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, '')
            .trim();
    }
    isRetryableError(error) {
        if (!error) {
            return false;
        }
        const message = error instanceof Error
            ? error.message.toLowerCase()
            : String(error).toLowerCase();
        if (message.includes('timeout') ||
            message.includes('timed out') ||
            message.includes('abort')) {
            return true;
        }
        if (message.includes('econnreset') ||
            message.includes('socket hang up') ||
            message.includes('network')) {
            return true;
        }
        if (message.includes('429') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            message.includes('rate limit') ||
            message.includes('temporarily unavailable')) {
            return true;
        }
        if (message.includes('invalid json') ||
            message.includes('user safety:')) {
            return false;
        }
        return false;
    }
    calculateBackoff(attempt) {
        const base = 1000;
        const exponential = base *
            Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 500);
        return Math.min(8000, exponential + jitter);
    }
    async sleep(milliseconds) {
        await new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    async createDummyQuestions() {
        await this.sleep(2000);
        return Array.from({ length: 5 }, (_, index) => this.createDummyQuestion(index));
    }
    createDummyQuestion(index) {
        const question = {
            id: this.generateQuestionId(index),
            index,
            type: 'MCQ',
            difficulty: 'MEDIUM',
            topic: 'General Knowledge',
            question: `This is dummy question ${index + 1}.`,
            media: null,
            options: [
                {
                    id: this.generateOptionId(index, 0),
                    text: `Question ${index + 1} - Option 1`,
                },
                {
                    id: this.generateOptionId(index, 1),
                    text: `Question ${index + 1} - Option 2`,
                },
                {
                    id: this.generateOptionId(index, 2),
                    text: `Question ${index + 1} - Option 3`,
                },
                {
                    id: this.generateOptionId(index, 3),
                    text: `Question ${index + 1} - Option 4`,
                },
            ],
            correctOptionId: this.generateOptionId(index, 0),
            points: 20,
            timeLimitSeconds: 20,
            status: 'WAITING',
            explanation: `Option 1 is the correct answer for dummy question ${index + 1}.`,
            stats: {
                totalAnswered: 0,
                correctCount: 0,
                optionDistribution: {},
            },
        };
        const stats = question.stats ?? {
            totalAnswered: 0,
            correctCount: 0,
            optionDistribution: {},
        };
        stats.optionDistribution ??= {};
        question.stats = stats;
        question.options.forEach((option) => {
            stats.optionDistribution[option.id] = 0;
        });
        return question;
    }
};
exports.QuizBattleQuestionService = QuizBattleQuestionService;
exports.QuizBattleQuestionService = QuizBattleQuestionService = QuizBattleQuestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], QuizBattleQuestionService);


/***/ },

/***/ "./apps/quiz-battle-service/src/services/quiz-battle-ranking.service.ts"
/*!******************************************************************************!*\
  !*** ./apps/quiz-battle-service/src/services/quiz-battle-ranking.service.ts ***!
  \******************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuizBattleRankingService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
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


/***/ },

/***/ "./libs/config/src/config.module.ts"
/*!******************************************!*\
  !*** ./libs/config/src/config.module.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./libs/config/src/config.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
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


/***/ },

/***/ "./libs/config/src/config.service.ts"
/*!*******************************************!*\
  !*** ./libs/config/src/config.service.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path = __importStar(__webpack_require__(/*! path */ "path"));
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const services_configs_1 = __importDefault(__webpack_require__(/*! ./service/services-configs */ "./libs/config/src/service/services-configs.ts"));
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


/***/ },

/***/ "./libs/config/src/index.ts"
/*!**********************************!*\
  !*** ./libs/config/src/index.ts ***!
  \**********************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
__exportStar(__webpack_require__(/*! ./config.module */ "./libs/config/src/config.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./config.service */ "./libs/config/src/config.service.ts"), exports);


/***/ },

/***/ "./libs/config/src/service/services-configs.ts"
/*!*****************************************************!*\
  !*** ./libs/config/src/service/services-configs.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports) {


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


/***/ },

/***/ "./libs/redis/src/index.ts"
/*!*********************************!*\
  !*** ./libs/redis/src/index.ts ***!
  \*********************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
__exportStar(__webpack_require__(/*! ./redis.module */ "./libs/redis/src/redis.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./redis.service */ "./libs/redis/src/redis.service.ts"), exports);


/***/ },

/***/ "./libs/redis/src/redis.module.ts"
/*!****************************************!*\
  !*** ./libs/redis/src/redis.module.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_service_1 = __webpack_require__(/*! ./redis.service */ "./libs/redis/src/redis.service.ts");
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


/***/ },

/***/ "./libs/redis/src/redis.service.ts"
/*!*****************************************!*\
  !*** ./libs/redis/src/redis.service.ts ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
const config_1 = __webpack_require__(/*! @app/config */ "./libs/config/src/index.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const ioredis_1 = __importDefault(__webpack_require__(/*! ioredis */ "ioredis"));
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


/***/ },

/***/ "@nestjs/common"
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/common");

/***/ },

/***/ "@nestjs/common/services"
/*!******************************************!*\
  !*** external "@nestjs/common/services" ***!
  \******************************************/
(module) {

module.exports = require("@nestjs/common/services");

/***/ },

/***/ "@nestjs/config"
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/config");

/***/ },

/***/ "@nestjs/core"
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
(module) {

module.exports = require("@nestjs/core");

/***/ },

/***/ "@nestjs/platform-socket.io"
/*!*********************************************!*\
  !*** external "@nestjs/platform-socket.io" ***!
  \*********************************************/
(module) {

module.exports = require("@nestjs/platform-socket.io");

/***/ },

/***/ "@nestjs/websockets"
/*!*************************************!*\
  !*** external "@nestjs/websockets" ***!
  \*************************************/
(module) {

module.exports = require("@nestjs/websockets");

/***/ },

/***/ "@socket.io/redis-adapter"
/*!*******************************************!*\
  !*** external "@socket.io/redis-adapter" ***!
  \*******************************************/
(module) {

module.exports = require("@socket.io/redis-adapter");

/***/ },

/***/ "class-validator"
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
(module) {

module.exports = require("class-validator");

/***/ },

/***/ "ioredis"
/*!**************************!*\
  !*** external "ioredis" ***!
  \**************************/
(module) {

module.exports = require("ioredis");

/***/ },

/***/ "openai"
/*!*************************!*\
  !*** external "openai" ***!
  \*************************/
(module) {

module.exports = require("openai");

/***/ },

/***/ "redis"
/*!************************!*\
  !*** external "redis" ***!
  \************************/
(module) {

module.exports = require("redis");

/***/ },

/***/ "socket.io"
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
(module) {

module.exports = require("socket.io");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
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
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
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
/*!**********************************************!*\
  !*** ./apps/quiz-battle-service/src/main.ts ***!
  \**********************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const quiz_battle_service_module_1 = __webpack_require__(/*! ./quiz-battle-service.module */ "./apps/quiz-battle-service/src/quiz-battle-service.module.ts");
const RedisIoAdapter_1 = __webpack_require__(/*! ./events/RedisIoAdapter */ "./apps/quiz-battle-service/src/events/RedisIoAdapter.ts");
const services_1 = __webpack_require__(/*! @nestjs/common/services */ "@nestjs/common/services");
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