import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schemas';
import { Logger } from '@nestjs/common';

export const DATABASE = Symbol('DATABASE');

export const createDatabase = (databaseUrl: string) => {

  // PostgreSQL Connection Pool
  const pool = new Pool({
    connectionString: databaseUrl,

    // Maximum active connections
    max: 20,

    // Close idle clients after 30 sec
    idleTimeoutMillis: 30000,

    // Fail if connection not established in 5 sec
    connectionTimeoutMillis: 5000,

    // Auto close inactive pools
    allowExitOnIdle: true,

    // Production SSL
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
          rejectUnauthorized: false,
        }
        : false,
  });

  // Pool Events
  pool.on('connect', () => {
    Logger.log('New PostgreSQL client connected');
  });

  pool.on('error', (err) => {
    Logger.error('Unexpected PostgreSQL Pool Error', err);
  });

  pool.on('remove', () => {
    Logger.warn('PostgreSQL client removed');
  });

  const db = drizzle(pool, {
    schema,
  });

  return {
    db,
    pool,
  };
};

export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabasePool = ReturnType<typeof createDatabase>['pool'];