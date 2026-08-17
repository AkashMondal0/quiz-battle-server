import {
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import {
  DATABASE,
} from './db/client';

import type {
  Database,
  DatabasePool,
} from './db/client';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE)
    private readonly database: Database,

    @Inject('DATABASE_POOL')
    private readonly pool: DatabasePool,
  ) {}

  get db(): Database {
    return this.database;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}