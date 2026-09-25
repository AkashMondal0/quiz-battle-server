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
import { ConfigModule, ConfigService } from '@app/config';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,

      imports: [
        ConfigModule,
      ],

      providers: [
        {
          provide: 'DATABASE_INSTANCE',
          inject: [ConfigService],
          useFactory: (
            configService: ConfigService,
          ) => {
            const databaseUrl =
              configService.getEnv("DATABASE_URL");

            if (!databaseUrl) {
              throw new Error(
                'DATABASE_URL environment variable is not defined',
              );
            }

            return createDatabase(
              databaseUrl,
            );
          },
        },

        {
          provide: DATABASE,
          inject: ['DATABASE_INSTANCE'],
          useFactory: (database: any) => {
            return database.db;
          },
        },

        {
          provide: 'DATABASE_POOL',
          inject: ['DATABASE_INSTANCE'],
          useFactory: (database: any) => {
            return database.pool;
          },
        },

        DatabaseService,
      ],

      exports: [
        DATABASE,
        'DATABASE_POOL',
        DatabaseService,
      ],
    };
  }
}