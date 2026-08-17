/**
 * DEVELOPMENT-ONLY account reset.
 *
 * Deletes test accounts on BOTH sides of the auth boundary so signup testing
 * can start from a clean state:
 *
 *   1. Supabase Auth users  — via the Auth Admin API (never SQL on auth.users)
 *   2. public.users rows    — which cascade to the 12 dependent tables
 *
 * Those two are independent: `public.users.id` mirrors `auth.users.id` by
 * convention but there is NO foreign key between them (see 0000_init.sql), so
 * deleting one never removes the other. That is why an orphaned Auth user
 * produces "An account with this email already exists" with no profile row —
 * this script reconciles both sides and reports orphans on either.
 *
 * Run:
 *   pnpm --filter @vital/api db:reset-dev-users -- --dry-run
 *   pnpm --filter @vital/api db:reset-dev-users
 *
 * Flags:
 *   --dry-run          List what would be deleted, then exit without deleting.
 *   --yes              Skip the interactive confirmation (CI / scripted use).
 *   --only=<substr>    Only accounts whose email contains <substr>.
 *   --keep=<a,b>       Comma-separated emails to preserve.
 *   --keep-staff       Preserve admin and lab_partner accounts.
 */
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { env } from '../lib/env.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { db } from './client.js';
import { bookingSlots, bookings, labUploads, users } from './schema.js';

/** A deletion target, reconciled across Supabase Auth and public.users. */
interface Target {
  id: string;
  email: string;
  /** Where the account currently exists. */
  inAuth: boolean;
  inDb: boolean;
  /** Role from public.users; null when the account is Auth-only. */
  role: string | null;
}

interface Options {
  dryRun: boolean;
  yes: boolean;
  only: string | null;
  keep: Set<string>;
  keepStaff: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    dryRun: argv.includes('--dry-run'),
    yes: argv.includes('--yes'),
    only: null,
    keep: new Set(),
    keepStaff: argv.includes('--keep-staff'),
  };
  for (const arg of argv) {
    if (arg.startsWith('--only=')) opts.only = arg.slice('--only='.length).toLowerCase();
    if (arg.startsWith('--keep=')) {
      for (const email of arg.slice('--keep='.length).split(',')) {
        const trimmed = email.trim().toLowerCase();
        if (trimmed) opts.keep.add(trimmed);
      }
    }
  }
  return opts;
}

/** Host only — never the service-role key or the database password. */
function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '(unparseable URL)';
  }
}

/** Page through the Auth Admin API; it caps out at 1000 users per page. */
async function listAllAuthUsers(): Promise<{ id: string; email: string }[]> {
  const out: { id: string; email: string }[] = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }
    for (const u of data.users) {
      out.push({ id: u.id, email: u.email ?? '(no email)' });
    }
    if (data.users.length < perPage) break;
  }
  return out;
}

/** Union the two sides so orphans on either are visible and cleanable. */
async function collectTargets(): Promise<Target[]> {
  const [authUsers, dbUsers] = await Promise.all([
    listAllAuthUsers(),
    db.select({ id: users.id, email: users.email, role: users.role }).from(users),
  ]);

  const byId = new Map<string, Target>();

  for (const a of authUsers) {
    byId.set(a.id, { id: a.id, email: a.email, inAuth: true, inDb: false, role: null });
  }
  for (const d of dbUsers) {
    const existing = byId.get(d.id);
    if (existing) {
      existing.inDb = true;
      existing.role = d.role;
      // Prefer the profile email; Auth may hold a stale address.
      existing.email = d.email;
    } else {
      byId.set(d.id, { id: d.id, email: d.email, inAuth: false, inDb: true, role: d.role });
    }
  }

  return [...byId.values()].sort((a, b) => a.email.localeCompare(b.email));
}

function applyFilters(targets: Target[], opts: Options): Target[] {
  return targets.filter((t) => {
    const email = t.email.toLowerCase();
    if (opts.keep.has(email)) return false;
    if (opts.keepStaff && (t.role === 'admin' || t.role === 'lab_partner')) return false;
    if (opts.only && !email.includes(opts.only)) return false;
    return true;
  });
}

/**
 * Release slot capacity held by the targets' active bookings.
 *
 * `booking_slots.booked_count` is maintained by the application, not by a
 * trigger — cancelBooking decrements it with `greatest(count - 1, 0)`. The
 * cascade that removes `bookings` does NOT touch it, so without this the slots
 * would stay permanently consumed by bookings that no longer exist. Must run
 * BEFORE the user rows are deleted, while the bookings still exist.
 */
async function releaseBookingSlots(ids: string[]): Promise<number> {
  const held = await db
    .select({ slotId: bookings.slotId, n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(inArray(bookings.userId, ids), eq(bookings.status, 'booked')))
    .groupBy(bookings.slotId);

  for (const row of held) {
    await db
      .update(bookingSlots)
      .set({ bookedCount: sql`greatest(${bookingSlots.bookedCount} - ${row.n}, 0)` })
      .where(eq(bookingSlots.id, row.slotId));
  }
  return held.reduce((sum, r) => sum + r.n, 0);
}

async function confirm(count: number): Promise<boolean> {
  if (!stdin.isTTY) {
    console.error(
      '\nRefusing to delete: stdin is not a TTY and --yes was not passed.\n' +
        'Re-run interactively, or pass --yes if you are scripting this.',
    );
    return false;
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `\nRESET ALL DEVELOPMENT USERS? This deletes ${count} account(s). Type "RESET" to continue: `,
    );
    return answer.trim() === 'RESET';
  } finally {
    rl.close();
  }
}

function printTable(targets: Target[]) {
  const emailWidth = Math.max(5, ...targets.map((t) => t.email.length));
  const header = `  ${'EMAIL'.padEnd(emailWidth)}  ${'ROLE'.padEnd(11)}  EXISTS IN`;
  console.log(`\n${header}`);
  console.log(`  ${'-'.repeat(emailWidth)}  ${'-'.repeat(11)}  ${'-'.repeat(16)}`);
  for (const t of targets) {
    const where = t.inAuth && t.inDb ? 'auth + db' : t.inAuth ? 'auth only' : 'db only';
    const flag = t.inAuth && t.inDb ? '' : '  (orphan)';
    console.log(
      `  ${t.email.padEnd(emailWidth)}  ${(t.role ?? '—').padEnd(11)}  ${where}${flag}`,
    );
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // 1. Never run against production.
  if (env.NODE_ENV === 'production') {
    console.error('Refusing to run: NODE_ENV=production. This is a development-only utility.');
    process.exit(1);
  }

  // 2. Show exactly what is being targeted (host only — no keys, no passwords).
  console.log('VITAL — development user reset');
  console.log(`  NODE_ENV        ${env.NODE_ENV}`);
  console.log(`  Supabase Auth   ${safeHost(env.SUPABASE_URL)}`);
  console.log(`  Database        ${safeHost(env.DATABASE_URL)}`);
  if (opts.only) console.log(`  Filter          email contains "${opts.only}"`);
  if (opts.keep.size) console.log(`  Preserving      ${[...opts.keep].join(', ')}`);
  if (opts.keepStaff) console.log('  Preserving      admin + lab_partner accounts');

  // 3. Reconcile both sides.
  const all = await collectTargets();
  const targets = applyFilters(all, opts);

  const skipped = all.length - targets.length;
  console.log(`\nFound ${all.length} account(s); ${targets.length} match, ${skipped} preserved.`);

  // 4. Nothing to do is a success, not an error.
  if (targets.length === 0) {
    console.log('Nothing to delete. Already clean.');
    process.exit(0);
  }

  printTable(targets);

  if (opts.dryRun) {
    console.log('\n--dry-run: no changes made.');
    process.exit(0);
  }

  // 5. Explicit confirmation.
  if (!opts.yes && !(await confirm(targets.length))) {
    console.log('\nAborted. Nothing was deleted.');
    process.exit(0);
  }

  const ids = targets.map((t) => t.id);

  // 6. Release slot capacity while the bookings still exist.
  const released = await releaseBookingSlots(ids);
  if (released > 0) {
    console.log(`\nReleased ${released} booked slot(s) back to capacity.`);
  }

  // 7. Delete Supabase Auth users through the Admin API, one at a time
  //    (there is no bulk endpoint). A failure on one must not abort the rest.
  let authDeleted = 0;
  const failures: { email: string; reason: string }[] = [];
  for (const t of targets) {
    if (!t.inAuth) continue;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(t.id);
    if (error) {
      // Already gone is fine — this script is meant to be re-runnable.
      if (/not found/i.test(error.message)) continue;
      failures.push({ email: t.email, reason: error.message });
      continue;
    }
    authDeleted += 1;
  }

  // 8. Delete the profile rows; the 12 dependent tables cascade.
  const dbIds = targets.filter((t) => t.inDb).map((t) => t.id);
  let dbDeleted = 0;
  if (dbIds.length > 0) {
    const removed = await db.delete(users).where(inArray(users.id, dbIds)).returning({ id: users.id });
    dbDeleted = removed.length;
  }

  // 9. `lab_uploads.uploaded_by` has no FK, so cascades leave it dangling on
  //    uploads that belong to surviving users. Clear those references.
  const cleared = await db
    .update(labUploads)
    .set({ uploadedBy: null })
    .where(inArray(labUploads.uploadedBy, ids))
    .returning({ id: labUploads.id });

  // 10. Report.
  console.log('\nDone.');
  console.log(`  Supabase Auth users deleted   ${authDeleted}`);
  console.log(`  public.users rows deleted     ${dbDeleted} (cascaded to dependent tables)`);
  if (cleared.length > 0) {
    console.log(`  lab_uploads.uploaded_by cleared ${cleared.length}`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} Auth deletion(s) failed:`);
    for (const f of failures) console.error(`  ${f.email}: ${f.reason}`);
    console.error('Re-run to retry — the script is idempotent.');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
