/**
 * Promote an existing user to admin by email. Run:
 *   pnpm --filter @vital/api db:make-admin you@example.com
 */
import { eq } from 'drizzle-orm';

import { db } from './client.js';
import { users } from './schema.js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: db:make-admin <email>');
    process.exit(1);
  }
  const [row] = await db
    .update(users)
    .set({ role: 'admin', updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!row) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  console.log(`Promoted ${row.email} → ${row.role}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
