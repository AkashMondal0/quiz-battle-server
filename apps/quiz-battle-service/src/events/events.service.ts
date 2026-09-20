import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface SocketUser {
  id: string;
  username: string;
  avatar?: string;
  avatarId?: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  private server?: Server;

  private readonly socketKey = 'SOCKET:CLIENTS';

  constructor(private readonly redisService: RedisService) {}

  // Called by gateway after Socket.IO server is ready.
  setSocket(server: Server): void {
    this.server = server;

    this.logger.log('Socket.IO server registered in EventsService');
  }

  extractUserFromSocket(client: Socket): SocketUser | null {
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

  // Register connected socket in Redis.
  async registerSocket(client: Socket, user: SocketUser): Promise<void> {
    await this.redisService.client.hset(this.socketKey, user.id, client.id);

    this.logger.log(
      `Redis socket registered | user=${user.id} socket=${client.id}`,
    );
  }

  // Remove socket from Redis.
  async unregisterSocket(client: Socket): Promise<void> {
    const user = this.extractUserFromSocket(client);

    if (!user) {
      return;
    }

    const currentSocketId = await this.redisService.client.hget(
      this.socketKey,
      user.id,
    );

    if (currentSocketId !== client.id) {
      this.logger.debug(
        `Skipping Redis cleanup because socket was replaced | user=${user.id}`,
      );

      return;
    }

    await this.redisService.client.hdel(this.socketKey, user.id);

    this.logger.log(
      `Redis socket removed | user=${user.id} socket=${client.id}`,
    );
  }

  // Get socket ID by user ID.
  async getSocketIdByUserId(userId: string): Promise<string | null> {
    if (typeof userId !== 'string' || !userId.trim()) {
      return null;
    }

    const socketId = await this.redisService.client.hget(
      this.socketKey,
      userId,
    );

    return socketId ?? null;
  }

  // Get multiple socket IDs.
  async findSocketIdsByUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds?.length) {
      return [];
    }

    const uniqueUserIds = [
      ...new Set(
        userIds.filter((id) => typeof id === 'string' && id.trim().length > 0),
      ),
    ];

    if (!uniqueUserIds.length) {
      return [];
    }

    const socketIds = await Promise.all(
      uniqueUserIds.map((userId) =>
        this.redisService.client.hget(this.socketKey, userId),
      ),
    );

    return socketIds.filter(
      (socketId): socketId is string =>
        typeof socketId === 'string' && socketId.length > 0,
    );
  }

  // Send message to selected users.
  async sendMessageToUsers(
    userIds: string[],
    data: {
      senderSocketId?: string;
      message?: string;
    },
  ): Promise<void> {
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
}