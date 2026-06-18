/**
 * System-generated notifications (Phase 2 — engagement). Computes alerts from a
 * user's live data against the admin notification rules and inserts them
 * idempotently (deduped per user via dedupe_key). New rows trigger a best-effort
 * push. Generation is lazy — called when the user opens their feed.
 */
import { type BiomarkerStatus, classifyBiomarkerSafe } from '@vital/shared';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  biomarkers,
  notifications,
  scoreSnapshots,
  userBiomarkerResults,
} from '../db/schema.js';
import { getNotificationConfig } from './notification-config.js';
import { pushToUser } from './push.js';

interface NewNotification {
  type: string;
  severity: string;
  title: string;
  body: string;
  link: string | null;
  dedupeKey: string;
}

/** Compute and persist any new system notifications for the user. */
export async function generateUserNotifications(userId: string): Promise<void> {
  const config = await getNotificationConfig();
  const pending: NewNotification[] = [];

  // Latest result per biomarker (value + tested date).
  const bmRows = await db
    .select({
      id: biomarkers.id,
      slug: biomarkers.slug,
      name: biomarkers.name,
      optimalLow: biomarkers.optimalLow,
      optimalHigh: biomarkers.optimalHigh,
      normalLow: biomarkers.normalLow,
      normalHigh: biomarkers.normalHigh,
    })
    .from(biomarkers)
    .where(eq(biomarkers.isActive, true));
  const ids = bmRows.map((b) => b.id);

  const latest = new Map<string, { value: number; testedAt: string }>();
  if (ids.length > 0) {
    const rows = await db
      .select({
        biomarkerId: userBiomarkerResults.biomarkerId,
        value: userBiomarkerResults.value,
        testedAt: userBiomarkerResults.testedAt,
      })
      .from(userBiomarkerResults)
      .where(
        and(eq(userBiomarkerResults.userId, userId), inArray(userBiomarkerResults.biomarkerId, ids)),
      )
      .orderBy(desc(userBiomarkerResults.testedAt), desc(userBiomarkerResults.createdAt));
    for (const r of rows) {
      if (!latest.has(r.biomarkerId)) {
        latest.set(r.biomarkerId, { value: Number(r.value), testedAt: r.testedAt });
      }
    }
  }

  // 1. Out-of-range alerts.
  if (config.out_of_range_alerts) {
    for (const b of bmRows) {
      const result = latest.get(b.id);
      if (!result) continue;
      const status: BiomarkerStatus = classifyBiomarkerSafe(result.value, {
        optimal_low: Number(b.optimalLow),
        optimal_high: Number(b.optimalHigh),
        normal_low: Number(b.normalLow),
        normal_high: Number(b.normalHigh),
      });
      if (status === 'alert') {
        pending.push({
          type: 'alert',
          severity: 'critical',
          title: `${b.name} is out of range`,
          body: `Your latest ${b.name} result is outside the normal range. Review what affects it and consider a follow-up.`,
          link: `biomarker/${b.id}`,
          // Dedupe per marker + tested date so a new test re-alerts.
          dedupeKey: `alert:${b.slug}:${result.testedAt}`,
        });
      }
    }
  }

  // 2. Retest reminder — newest test older than the configured cadence.
  if (config.retest_reminders && latest.size > 0) {
    const newest = [...latest.values()].reduce(
      (max, r) => (r.testedAt > max ? r.testedAt : max),
      '0000-00-00',
    );
    const newestMs = new Date(newest).getTime();
    const cutoff = Date.now() - config.retest_cadence_months * 30 * 86_400_000;
    if (Number.isFinite(newestMs) && newestMs < cutoff) {
      pending.push({
        type: 'retest',
        severity: 'info',
        title: 'Time for a re-test',
        body: `It's been over ${config.retest_cadence_months} months since your last panel. A fresh test keeps your trends accurate.`,
        link: null,
        dedupeKey: `retest:${newest}`,
      });
    }
  }

  // 3. Score-drop alert — latest snapshot fell vs the previous one.
  if (config.score_drop_alerts) {
    const snaps = await db
      .select({ score: scoreSnapshots.score, recordedOn: scoreSnapshots.recordedOn })
      .from(scoreSnapshots)
      .where(eq(scoreSnapshots.userId, userId))
      .orderBy(desc(scoreSnapshots.recordedOn))
      .limit(2);
    if (snaps.length === 2) {
      const drop = snaps[1]!.score - snaps[0]!.score;
      if (drop >= config.score_drop_threshold) {
        pending.push({
          type: 'score',
          severity: 'warning',
          title: 'Your VITAL Score dropped',
          body: `Your score fell ${drop} points to ${snaps[0]!.score}. Check which markers moved.`,
          link: null,
          dedupeKey: `score-drop:${snaps[0]!.recordedOn}`,
        });
      }
    }
  }

  if (pending.length === 0) return;

  const inserted = await db
    .insert(notifications)
    .values(pending.map((n) => ({ userId, ...n })))
    .onConflictDoNothing({ target: [notifications.userId, notifications.dedupeKey] })
    .returning({ id: notifications.id, title: notifications.title, body: notifications.body });

  for (const n of inserted) {
    void pushToUser(userId, { title: n.title, body: n.body });
  }
}

/**
 * Insert a single notification for a user (deduped) and fire a best-effort push.
 * Used for event-driven notifications like booking confirmations.
 */
export async function notifyUser(
  userId: string,
  n: { type: string; severity: string; title: string; body: string; link?: string | null; dedupeKey: string },
): Promise<void> {
  const [inserted] = await db
    .insert(notifications)
    .values({
      userId,
      type: n.type,
      severity: n.severity,
      title: n.title,
      body: n.body,
      link: n.link ?? null,
      dedupeKey: n.dedupeKey,
    })
    .onConflictDoNothing({ target: [notifications.userId, notifications.dedupeKey] })
    .returning({ id: notifications.id });

  if (inserted) void pushToUser(userId, { title: n.title, body: n.body });
}

