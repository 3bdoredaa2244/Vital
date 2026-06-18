/**
 * Notifications & device registration (Phase 2 — engagement).
 *
 *   GET  /notifications/me       → generate fresh alerts, return feed + unread
 *   POST /notifications/me/read  → mark all (or given ids) read
 *   POST /devices                → register an Expo push token
 */
import { markReadSchema, registerDeviceSchema } from '@vital/shared';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { deviceTokens, notifications } from '../db/schema.js';
import { generateUserNotifications } from '../lib/notifications.js';
import { serializeNotification } from '../lib/serialize.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { validate } from '../middleware/validate.js';

export const notificationRoutes = new Hono<{ Variables: AuthVariables }>();

// Device registration only needs auth (so tokens persist across lapses).
notificationRoutes.post(
  '/devices',
  requireAuth,
  validate('json', registerDeviceSchema),
  async (c) => {
    const userId = c.get('userId');
    const { token, platform } = c.req.valid('json');
    await db
      .insert(deviceTokens)
      .values({ userId, token, platform })
      .onConflictDoUpdate({ target: deviceTokens.token, set: { userId, platform } });
    return c.json({ success: true });
  },
);

notificationRoutes.use('/notifications/*', requireAuth, requireActiveSubscription);

notificationRoutes.get('/notifications/me', async (c) => {
  const userId = c.get('userId');
  await generateUserNotifications(userId);

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return c.json({ notifications: rows.map(serializeNotification), unread_count: n });
});

notificationRoutes.post('/notifications/me/read', validate('json', markReadSchema), async (c) => {
  const userId = c.get('userId');
  const { ids } = c.req.valid('json');
  const where =
    ids && ids.length
      ? and(eq(notifications.userId, userId), inArray(notifications.id, ids))
      : and(eq(notifications.userId, userId), isNull(notifications.readAt));
  await db.update(notifications).set({ readAt: new Date() }).where(where);
  return c.json({ success: true });
});
