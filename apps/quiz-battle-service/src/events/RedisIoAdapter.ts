import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  private pubClient?: RedisClientType;

  private subClient?: RedisClientType;

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined');
    }

    this.pubClient = createClient({
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

    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);

    this.logger.log('Redis Socket.IO adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (!this.adapterConstructor) {
      throw new Error('Redis adapter is not initialized');
    }

    server.adapter(this.adapterConstructor);

    return server;
  }

  async close(): Promise<void> {
    await Promise.all([this.pubClient?.quit(), this.subClient?.quit()]);
  }
}
