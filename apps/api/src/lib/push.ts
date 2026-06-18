/**
 * Best-effort push delivery via Expo's push service. No SDK or credentials are
 * required (Expo accepts unauthenticated sends for ExponentPushToken values),
 * so this degrades gracefully: with no registered device tokens it is a no-op,
 * and any delivery error is swallowed after logging — pushes must never break
 * the primary request.
 */
import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { deviceTokens } from '../db/schema.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function pushToUser(
  userId: string,
  message: { title: string; body: string },
): Promise<void> {
  try {
    const tokens = await db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId));
    const valid = tokens.map((t) => t.token).filter((t) => t.startsWith('ExponentPushToken'));
    if (valid.length === 0) return;

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        valid.map((to) => ({ to, title: message.title, body: message.body, sound: 'default' })),
      ),
    });
  } catch (err) {
    console.error('Push delivery failed for user', userId, err);
  }
}
