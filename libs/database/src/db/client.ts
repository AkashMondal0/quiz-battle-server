import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schemas';

export const DATABASE = Symbol('DATABASE');

export const createDatabase = (databaseUrl: string) => {
  const pool = new Pool({
    connectionString: databaseUrl,

    max: 20,
    min: 2,

    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,

    keepAlive: true,
  });

  pool.on('error', (error) => {
    console.error('[Database] Unexpected PostgreSQL pool error', error);
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