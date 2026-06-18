/**
 * User biomarker results (manual entry for Phase 1). Gated behind an active
 * subscription. Validates the submitted value against the biomarker's
 * physiologically plausible window.
 */
import { createResultSchema } from '@vital/shared';
import { and, asc, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { biomarkers, userBiomarkerResults } from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import { recordScoreSnapshot } from '../lib/score.js';
import { serializeResult } from '../lib/serialize.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { validate } from '../middleware/validate.js';

export const resultRoutes = new Hono<{ Variables: AuthVariables }>();

resultRoutes.use('*', requireAuth, requireActiveSubscription);

// All of the user's results, newest first.
resultRoutes.get('/me', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(userBiomarkerResults)
    .where(eq(userBiomarkerResults.userId, userId))
    .orderBy(desc(userBiomarkerResults.testedAt));
  return c.json({ results: rows.map(serializeResult) });
});

// History for a single biomarker (oldest → newest for charting).
resultRoutes.get('/me/:biomarkerId', async (c) => {
  const userId = c.get('userId');
  const biomarkerId = c.req.param('biomarkerId');

  const rows = await db
    .select()
    .from(userBiomarkerResults)
    .where(
      and(
        eq(userBiomarkerResults.userId, userId),
        eq(userBiomarkerResults.biomarkerId, biomarkerId),
      ),
    )
    .orderBy(asc(userBiomarkerResults.testedAt));

  return c.json({ results: rows.map(serializeResult) });
});

resultRoutes.post('/', validate('json', createResultSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  const [bm] = await db
    .select()
    .from(biomarkers)
    .where(eq(biomarkers.id, body.biomarker_id))
    .limit(1);
  if (!bm) return errorResponse(c, 'not_found', 'Biomarker not found');

  const min = Number(bm.minPlausible);
  const max = Number(bm.maxPlausible);
  if (body.value < min || body.value > max) {
    return errorResponse(
      c,
      'unprocessable',
      `Value must be between ${min} and ${max} ${bm.unit}`,
    );
  }

  const [row] = await db
    .insert(userBiomarkerResults)
    .values({
      userId,
      biomarkerId: body.biomarker_id,
      value: String(body.value),
      testedAt: body.tested_at,
      labName: body.lab_name ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  // Refresh today's VITAL Score snapshot (best-effort; never blocks the write).
  await recordScoreSnapshot(userId);

  return c.json({ result: serializeResult(row!) }, 201);
});

resultRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const [deleted] = await db
    .delete(userBiomarkerResults)
    .where(and(eq(userBiomarkerResults.id, id), eq(userBiomarkerResults.userId, userId)))
    .returning();

  if (!deleted) return errorResponse(c, 'not_found', 'Result not found');

  await recordScoreSnapshot(userId);

  return c.json({ success: true });
});
