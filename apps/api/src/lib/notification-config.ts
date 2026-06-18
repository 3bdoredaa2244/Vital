/**
 * Admin-managed notification rules, stored as a single app_settings row and
 * merged over DEFAULT_NOTIFICATION_CONFIG.
 */
import {
  type NotificationConfig,
  type NotificationConfigInput,
  DEFAULT_NOTIFICATION_CONFIG,
} from '@vital/shared';
import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { appSettings } from '../db/schema.js';

const KEY = 'notification_config';

export async function getNotificationConfig(): Promise<NotificationConfig> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
  return { ...DEFAULT_NOTIFICATION_CONFIG, ...((row?.value as Partial<NotificationConfig>) ?? {}) };
}

export async function setNotificationConfig(
  config: NotificationConfigInput,
): Promise<NotificationConfig> {
  await db
    .insert(appSettings)
    .values({ key: KEY, value: config, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: config, updatedAt: new Date() } });
  return getNotificationConfig();
}
