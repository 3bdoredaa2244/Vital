/**
 * `requireActiveSubscription` — gates biomarker data behind a paid, non-expired
 * subscription. Must run AFTER `requireAuth`.
 */
import { and, eq, gt } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import { db } from '../db/client.js';
import { subscriptions } from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import type { AuthVariables } from './auth.js';

export interface SubscriptionVariables extends AuthVariables {
  subscriptionId: string;
}

export const requireActiveSubscription = createMiddleware<{
  Variables: SubscriptionVariables;
}>(async (c, next) => {
  const userId = c.get('userId');

  const [active] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!active) {
    return errorResponse(
      c,
      'forbidden',
      'An active subscription is required to access biomarker data',
    );
  }

  c.set('subscriptionId', active.id);
  await next();
});
