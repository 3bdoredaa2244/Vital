/**
 * AI configuration helper. The whole AiConfig is stored as a single app_settings
 * row (`ai_config`) and merged over DEFAULT_AI_CONFIG so the app always has a
 * complete, valid config even before an admin touches it.
 */
import { type AiConfig, type AiConfigInput, DEFAULT_AI_CONFIG } from '@vital/shared';
import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { appSettings } from '../db/schema.js';

const KEY = 'ai_config';

export async function getAiConfig(): Promise<AiConfig> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
  const stored = (row?.value as Partial<AiConfig>) ?? {};
  return {
    ...DEFAULT_AI_CONFIG,
    ...stored,
    features: { ...DEFAULT_AI_CONFIG.features, ...(stored.features ?? {}) },
  };
}

export async function setAiConfig(config: AiConfigInput): Promise<AiConfig> {
  await db
    .insert(appSettings)
    .values({ key: KEY, value: config, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: config, updatedAt: new Date() } });
  return getAiConfig();
}
