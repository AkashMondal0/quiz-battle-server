import {
  DynamicModule,
  Global,
  Module,
} from '@nestjs/common';

import {
  DATABASE,
  createDatabase,
} from './db/client';

import { DatabaseService } from './database.service';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not defined',
      );
    }

    const database = createDatabase(databaseUrl);

    return {
      module: DatabaseModule,

      providers: [
        {
          provide: DATABASE,
          useValue: database.db,
        },

        {
          provide: 'DATABASE_POOL',
          useValue: database.pool,
        },

        DatabaseService,
      ],

      exports: [
        DATABASE,
        DatabaseService,
      ],
    };
  }
}