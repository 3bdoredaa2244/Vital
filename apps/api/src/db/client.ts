/**
 * Drizzle database client backed by the `postgres` driver against Supabase's
 * Postgres connection string.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../lib/env.js';
import * as schema from './schema.js';

// `prepare: false` is recommended when going through Supabase's transaction
// pooler (pgbouncer). Safe for the session pooler too.
const queryClient = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(queryClient, { schema });
export { schema };
export type DB = typeof db;
