/**
 * Applies pending Drizzle migrations. Run with `pnpm db:migrate`.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { env } from '../lib/env.js';

async function main() {
  // `prepare: false` matches the runtime client — required for Supabase's
  // transaction pooler (pgbouncer/Supavisor), which rejects prepared statements.
  const migrationClient = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(migrationClient);
  console.log('Running migrations…');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete.');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
