/**
 * Subscription plan listing + the current user's subscription.
 */
import type { SubscriptionWithPlan } from '@vital/shared';
import { and, asc, desc, eq, gt } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { subscriptionPlans, subscriptions } from '../db/schema.js';
import { serializePlan, serializeSubscription } from '../lib/serialize.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';

export const subscriptionRoutes = new Hono<{ Variables: AuthVariables }>();

// Public: anyone can view the plans (used on the pre-auth marketing/plans flow).
subscriptionRoutes.get('/subscription-plans', async (c) => {
  const rows = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(asc(subscriptionPlans.priceEgp));
  return c.json({ plans: rows.map(serializePlan) });
});

// Current user's active subscription (with plan), if any.
subscriptionRoutes.get('/subscriptions/me', requireAuth, async (c) => {
  const userId = c.get('userId');

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(subscriptions.startedAt))
    .limit(1);

  if (!row) return c.json({ subscription: null });

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, row.planId))
    .limit(1);

  const payload: SubscriptionWithPlan = {
    ...serializeSubscription(row),
    plan: serializePlan(plan!),
  };

  return c.json({ subscription: payload });
});
