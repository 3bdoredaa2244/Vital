/**
 * App content/settings helpers. Content is stored as individual key→jsonb rows
 * in app_settings and merged over DEFAULT_APP_CONTENT so the app always has a
 * complete, valid bundle even before anything is configured.
 */
import { type AppContent, type AppContentInput, DEFAULT_APP_CONTENT } from '@vital/shared';
import { inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import { appSettings } from '../db/schema.js';

const KEYS = ['welcome_tagline', 'support_email', 'lab_partner'] as const;

export async function getAppContent(): Promise<AppContent> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, KEYS as unknown as string[]));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    welcome_tagline:
      (map.get('welcome_tagline') as string) ?? DEFAULT_APP_CONTENT.welcome_tagline,
    support_email: (map.get('support_email') as string) ?? DEFAULT_APP_CONTENT.support_email,
    lab_partner:
      (map.get('lab_partner') as AppContent['lab_partner']) ?? DEFAULT_APP_CONTENT.lab_partner,
  };
}

export async function setAppContent(content: AppContentInput): Promise<AppContent> {
  const entries: { key: string; value: unknown }[] = [
    { key: 'welcome_tagline', value: content.welcome_tagline },
    { key: 'support_email', value: content.support_email },
    { key: 'lab_partner', value: content.lab_partner },
  ];
  for (const e of entries) {
    await db
      .insert(appSettings)
      .values({ key: e.key, value: e.value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: e.value, updatedAt: new Date() },
      });
  }
  return getAppContent();
}
