/**
 * Rules-based recommendation engine (Phase 2 — supplement & protocol guidance).
 *
 * Pure and deterministic. Given the admin-managed intervention catalog and a
 * user's biomarker statuses, surface the interventions whose target markers are
 * currently in a triggering state, ranked by how many markers they address,
 * evidence strength, then display order.
 */
import type { Intervention, RecommendationMarker, RecommendedIntervention } from './types/index.js';

const EVIDENCE_RANK: Record<Intervention['evidence_level'], number> = {
  strong: 0,
  moderate: 1,
  limited: 2,
};

export function recommendInterventions(
  interventions: Intervention[],
  markers: RecommendationMarker[],
): RecommendedIntervention[] {
  const bySlug = new Map(markers.map((m) => [m.slug, m]));
  const out: RecommendedIntervention[] = [];

  for (const iv of interventions) {
    if (!iv.is_active) continue;
    const matched = iv.target_biomarker_slugs
      .map((slug) => bySlug.get(slug))
      .filter((m): m is RecommendationMarker => !!m && iv.trigger_statuses.includes(m.status));
    if (matched.length > 0) out.push({ intervention: iv, matched });
  }

  out.sort(
    (a, b) =>
      b.matched.length - a.matched.length ||
      EVIDENCE_RANK[a.intervention.evidence_level] - EVIDENCE_RANK[b.intervention.evidence_level] ||
      a.intervention.display_order - b.intervention.display_order,
  );
  return out;
}
