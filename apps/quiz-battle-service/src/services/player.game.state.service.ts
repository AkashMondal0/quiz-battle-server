import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@app/redis';

@Injectable()
export class PlayerGameStateService {
  private readonly logger = new Logger(PlayerGameStateService.name);
  private readonly KEY = 'game:players:room';

  constructor(private readonly redisService: RedisService) {}

  async enterGame(userId: string, roomId: string): Promise<boolean> {
    const existingRoomId = await this.getRoomId(userId);

    // Player is already in the SAME room → treat as success (reconnect)
    if (existingRoomId === roomId) {
      return true;
    }

    // Player is in a DIFFERENT room → reject
    if (existingRoomId) {
      return false;
    }

    await this.redisService.client.hset(this.KEY, userId, roomId);
    return true;
  }

  async startGame(
    roomId: string,
    gameDuration: number = 1000 * 60 * 10,
  ): Promise<boolean> {
    const key = `game:room:${roomId}:expiration`;

    const result = await this.redisService.client.set(
      key,
      Date.now().toString(),
      'PX',
      gameDuration,
      'NX',
    );

    return result === 'OK';
  }

  async getRoomId(userId: string): Promise<string | null> {
    return this.redisService.client.hget(this.KEY, userId);
  }

  async isInGame(userId: string): Promise<boolean> {
    const roomId = await this.getRoomId(userId);
    return roomId !== null;
  }

  async leaveGame(userId: string): Promise<boolean> {
    const removed = await this.redisService.client.hdel(this.KEY, userId);
    return removed === 1;
  }

  async getAllPlayers(): Promise<Record<string, string>> {
    return this.redisService.client.hgetall(this.KEY);
  }

  async getPlayersInRoom(roomId: string): Promise<string[]> {
    const players = await this.getAllPlayers();
    return Object.entries(players)
      .filter(([, playerRoomId]) => playerRoomId === roomId)
      .map(([userId]) => userId);
  }
}