/**
 * Public-facing content the mobile app reads: the admin-managed app content
 * bundle (tagline, lab partner, support) and the active onboarding goal options.
 */
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import type { AiStatus } from '@vital/shared';

import { db } from '../db/client.js';
import { healthGoals } from '../db/schema.js';
import { getAiConfig } from '../lib/ai-config.js';
import { getAppContent } from '../lib/content.js';
import { serializeHealthGoal } from '../lib/serialize.js';

export const contentRoutes = new Hono();

// Public — used on the pre-auth welcome screen.
contentRoutes.get('/app-content', async (c) => {
  const content = await getAppContent();
  return c.json({ content });
});

// Active onboarding goal options.
contentRoutes.get('/health-goals', async (c) => {
  const rows = await db
    .select()
    .from(healthGoals)
    .where(eq(healthGoals.isActive, true))
    .orderBy(asc(healthGoals.displayOrder));
  return c.json({ goals: rows.map(serializeHealthGoal) });
});

// AI availability + disclaimer, so the app knows whether to show AI surfaces.
contentRoutes.get('/ai-status', async (c) => {
  const cfg = await getAiConfig();
  const status: AiStatus = {
    enabled: cfg.enabled,
    features: cfg.features,
    allow_user_generate: cfg.allow_user_generate,
    disclaimer: cfg.disclaimer,
  };
  return c.json({ status });
});
