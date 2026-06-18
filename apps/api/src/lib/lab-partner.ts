/**
 * Lab partner data helpers: area scoping (which areas a partner is assigned to),
 * per-user access checks, and the patient's active-plan summary (the "tests
 * required" panel shown on an appointment).
 */
import type { PartnerPlanSummary } from '@vital/shared';
import { and, eq, gt, inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  bookings,
  labPartnerAreas,
  subscriptionPlans,
  subscriptions,
} from '../db/schema.js';

/** Service-area ids a partner is assigned to. */
export async function partnerAreaIds(partnerId: string): Promise<string[]> {
  const rows = await db
    .select({ areaId: labPartnerAreas.areaId })
    .from(labPartnerAreas)
    .where(eq(labPartnerAreas.partnerId, partnerId));
  return rows.map((r) => r.areaId);
}

/** Partner (user) ids assigned to a service area — recipients of visit alerts. */
export async function partnerIdsForArea(areaId: string): Promise<string[]> {
  const rows = await db
    .select({ partnerId: labPartnerAreas.partnerId })
    .from(labPartnerAreas)
    .where(eq(labPartnerAreas.areaId, areaId));
  return rows.map((r) => r.partnerId);
}

/**
 * A partner may view a user only if that user has at least one booking in one of
 * the partner's assigned areas.
 */
export async function partnerCanAccessUser(
  partnerId: string,
  userId: string,
): Promise<boolean> {
  const areaIds = await partnerAreaIds(partnerId);
  if (areaIds.length === 0) return false;
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.userId, userId), inArray(bookings.areaId, areaIds)))
    .limit(1);
  return Boolean(row);
}

/** The user's active subscription plan, as a "tests required" summary. */
export async function activePlanSummary(userId: string): Promise<PartnerPlanSummary | null> {
  const [row] = await db
    .select({
      name: subscriptionPlans.name,
      biomarkerCount: subscriptionPlans.biomarkerCount,
      annualTestsCount: subscriptionPlans.annualTestsCount,
      features: subscriptionPlans.features,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    name: row.name as PartnerPlanSummary['name'],
    biomarker_count: row.biomarkerCount,
    annual_tests_count: row.annualTestsCount,
    features: row.features ?? [],
  };
}
