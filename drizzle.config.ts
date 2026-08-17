import 'dotenv/config';
import { defineConfi } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/database/src/db/schema/*.schema.ts',

  out: './drizzle',

  dialect: 'postgresql',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  strict: true,

  verbose: true,
});