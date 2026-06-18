/**
 * Compute a user's personalized recommendations from the admin-managed
 * intervention catalog + the user's current biomarker statuses, using the
 * shared rules engine.
 */
import {
  type BiomarkerStatus,
  type RecommendationMarker,
  type RecommendedIntervention,
  classifyBiomarkerSafe,
  recommendInterventions,
} from '@vital/shared';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import { biomarkers, interventions, userBiomarkerResults } from '../db/schema.js';
import { serializeIntervention } from './serialize.js';

export async function computeUserRecommendations(
  userId: string,
): Promise<RecommendedIntervention[]> {
  const activeInterventions = await db
    .select()
    .from(interventions)
    .where(eq(interventions.isActive, true))
    .orderBy(asc(interventions.displayOrder));
  if (activeInterventions.length === 0) return [];

  // Only the markers any intervention targets are needed.
  const targetSlugs = [...new Set(activeInterventions.flatMap((i) => i.targetBiomarkerSlugs ?? []))];
  if (targetSlugs.length === 0) return [];

  const bmRows = await db
    .select({
      id: biomarkers.id,
      slug: biomarkers.slug,
      name: biomarkers.name,
      optimalLow: biomarkers.optimalLow,
      optimalHigh: biomarkers.optimalHigh,
      normalLow: biomarkers.normalLow,
      normalHigh: biomarkers.normalHigh,
    })
    .from(biomarkers)
    .where(and(eq(biomarkers.isActive, true), inArray(biomarkers.slug, targetSlugs)));
  if (bmRows.length === 0) return [];

  const ids = bmRows.map((b) => b.id);
  const latest = new Map<string, number>();
  const resultRows = await db
    .select({ biomarkerId: userBiomarkerResults.biomarkerId, value: userBiomarkerResults.value })
    .from(userBiomarkerResults)
    .where(
      and(eq(userBiomarkerResults.userId, userId), inArray(userBiomarkerResults.biomarkerId, ids)),
    )
    .orderBy(desc(userBiomarkerResults.testedAt), desc(userBiomarkerResults.createdAt));
  for (const r of resultRows) {
    if (!latest.has(r.biomarkerId)) latest.set(r.biomarkerId, Number(r.value));
  }

  const markers: RecommendationMarker[] = bmRows.map((b) => {
    const status: BiomarkerStatus = classifyBiomarkerSafe(latest.get(b.id), {
      optimal_low: Number(b.optimalLow),
      optimal_high: Number(b.optimalHigh),
      normal_low: Number(b.normalLow),
      normal_high: Number(b.normalHigh),
    });
    return { slug: b.slug, name: b.name, status };
  });

  return recommendInterventions(activeInterventions.map(serializeIntervention), markers);
}
