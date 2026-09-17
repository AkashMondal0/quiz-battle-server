import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';

@Injectable()
export class PlayerGameStateService {
  private readonly KEY = 'game:players:room';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Put a player into a game.
   *
   * userId -> roomId
   */
  async enterGame(userId: string, roomId: string): Promise<boolean> {
    const existingRoomId = await this.getRoomId(userId);

    // Player is already in a game.
    if (existingRoomId) {
      return false;
    }

    await this.redisService.client.hset(this.KEY, userId, roomId);

    return true;
  }

  /**
   * Get the room where the player is currently playing.
   *
   * Returns null if player is not in any game.
   */
  async getRoomId(userId: string): Promise<string | null> {
    return this.redisService.client.hget(this.KEY, userId);
  }

  /**
   * Check whether the player is currently in a game.
   */
  async isInGame(userId: string): Promise<boolean> {
    const roomId = await this.getRoomId(userId);

    return roomId !== null;
  }

  /**
   * Remove player from their current game.
   */
  async leaveGame(userId: string): Promise<boolean> {
    const removed = await this.redisService.client.hdel(this.KEY, userId);

    return removed === 1;
  }

  /**
   * Get all players currently in games.
   *
   * userId -> roomId
   */
  async getAllPlayers(): Promise<Record<string, string>> {
    return this.redisService.client.hgetall(this.KEY);
  }

  /**
   * Get all players inside a specific room.
   */
  async getPlayersInRoom(roomId: string): Promise<string[]> {
    const players = await this.getAllPlayers();

    return Object.entries(players)
      .filter(([, playerRoomId]) => playerRoomId === roomId)
      .map(([userId]) => userId);
  }
}