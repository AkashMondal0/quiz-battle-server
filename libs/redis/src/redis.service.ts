import { ConfigService } from '@app/config';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getEnv('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not defined');
    }

    this.client = new Redis(redisUrl);
  }

  async onModuleInit() {
    await this.client.config('SET', 'notify-keyspace-events', 'Ex');

    this.logger.log('Redis key expiration notifications enabled');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async set(key: string, value: unknown, ttl?: number) {
    const data = JSON.stringify(value);

    if (ttl) {
      await this.client.set(key, data, 'EX', ttl);

      return;
    }

    await this.client.set(key, data);
  }

  async delete(key: string) {
    await this.client.del(key);
  }

  async exists(key: string) {
    return this.client.exists(key);
  }
}
