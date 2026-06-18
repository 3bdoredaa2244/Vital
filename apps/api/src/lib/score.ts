/**
 * VITAL health-model computation + persistence (Phase 2, lab-only).
 *
 * `computeUserScore` assembles a user's active biomarkers + latest results into
 * the shared `computeHealthAssessment` engine (PhenoAge biological age, Health /
 * Cardiometabolic / Longevity / Confidence). `recordScoreSnapshot` upserts one
 * snapshot per user per day so the history trend builds up.
 */
import {
  type HealthMarkerInput,
  type VitalScore,
  applyLabRange,
  computeHealthAssessment,
} from '@vital/shared';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  biomarkerCategories,
  biomarkers,
  scoreSnapshots,
  userBiomarkerResults,
  users,
} from '../db/schema.js';

/** Build the current health assessment for a user from live data. */
export async function computeUserScore(userId: string): Promise<VitalScore> {
  const rows = await db
    .select({
      id: biomarkers.id,
      slug: biomarkers.slug,
      name: biomarkers.name,
      optimalLow: biomarkers.optimalLow,
      optimalHigh: biomarkers.optimalHigh,
      normalLow: biomarkers.normalLow,
      normalHigh: biomarkers.normalHigh,
      minPlausible: biomarkers.minPlausible,
      maxPlausible: biomarkers.maxPlausible,
      categorySlug: biomarkerCategories.slug,
      categoryName: biomarkerCategories.name,
    })
    .from(biomarkers)
    .innerJoin(biomarkerCategories, eq(biomarkers.categoryId, biomarkerCategories.id))
    .where(eq(biomarkers.isActive, true))
    .orderBy(asc(biomarkers.displayOrder));

  // Latest result per biomarker for this user, with the lab's captured range.
  const ids = rows.map((r) => r.id);
  const latest = new Map<
    string,
    { value: number; testedAt: string; refLow: number | null; refHigh: number | null }
  >();
  if (ids.length > 0) {
    const resultRows = await db
      .select({
        biomarkerId: userBiomarkerResults.biomarkerId,
        value: userBiomarkerResults.value,
        testedAt: userBiomarkerResults.testedAt,
        refLow: userBiomarkerResults.refLow,
        refHigh: userBiomarkerResults.refHigh,
      })
      .from(userBiomarkerResults)
      .where(
        and(eq(userBiomarkerResults.userId, userId), inArray(userBiomarkerResults.biomarkerId, ids)),
      )
      .orderBy(desc(userBiomarkerResults.testedAt), desc(userBiomarkerResults.createdAt));
    for (const r of resultRows) {
      if (!latest.has(r.biomarkerId)) {
        latest.set(r.biomarkerId, {
          value: Number(r.value),
          testedAt: r.testedAt,
          refLow: r.refLow != null ? Number(r.refLow) : null,
          refHigh: r.refHigh != null ? Number(r.refHigh) : null,
        });
      }
    }
  }

  const markers: HealthMarkerInput[] = rows.map((r) => {
    const result = latest.get(r.id);
    // Score against the patient's own lab range (age/sex-specific) when present.
    const ranges = applyLabRange(
      {
        optimal_low: Number(r.optimalLow),
        optimal_high: Number(r.optimalHigh),
        normal_low: Number(r.normalLow),
        normal_high: Number(r.normalHigh),
        min_plausible: Number(r.minPlausible),
        max_plausible: Number(r.maxPlausible),
      },
      { ref_low: result?.refLow ?? null, ref_high: result?.refHigh ?? null },
    );
    return {
      slug: r.slug,
      name: r.name,
      categorySlug: r.categorySlug,
      categoryName: r.categoryName,
      value: result ? result.value : null,
      tested_at: result?.testedAt ?? null,
      ...ranges,
    };
  });

  const [user] = await db
    .select({ dateOfBirth: users.dateOfBirth })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return computeHealthAssessment(markers, { dateOfBirth: user?.dateOfBirth ?? null });
}

/**
 * Compute the assessment and upsert today's snapshot. Best-effort: callers
 * should not let a snapshot failure break the primary mutation.
 */
export async function recordScoreSnapshot(userId: string): Promise<void> {
  try {
    const score = await computeUserScore(userId);
    const recordedOn = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const breakdown = score.category_scores.map((c) => ({
      slug: c.slug,
      name: c.name,
      score: c.score,
      tested: c.tested,
      total: c.total,
    }));
    const values = {
      score: score.score,
      band: score.band,
      testedCount: score.tested_count,
      totalCount: score.total_count,
      biologicalAge: score.biological_age,
      cardiometabolicScore: score.cardiometabolic_score,
      longevityScore: score.longevity_score,
      confidence: score.confidence,
      breakdown,
    };
    await db
      .insert(scoreSnapshots)
      .values({ userId, recordedOn, ...values })
      .onConflictDoUpdate({
        target: [scoreSnapshots.userId, scoreSnapshots.recordedOn],
        set: values,
      });
  } catch (err) {
    console.error('Failed to record score snapshot for user', userId, err);
  }
}
