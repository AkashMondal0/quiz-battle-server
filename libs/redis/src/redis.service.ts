import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleDestroy
{
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(
      process.env.REDIS_URL ||
        'redis://localhost:6379',
    );
  }

  async get<T>(
    key: string,
  ): Promise<T | null> {

    const value =
      await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async set(
    key: string,
    value: unknown,
    ttl?: number,
  ) {

    const data =
      JSON.stringify(value);

    if (ttl) {
      await this.client.set(
        key,
        data,
        'EX',
        ttl,
      );

      return;
    }

    await this.client.set(
      key,
      data,
    );
  }

  async delete(
    key: string,
  ) {
    await this.client.del(key);
  }

  async exists(
    key: string,
  ) {
    return this.client.exists(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}