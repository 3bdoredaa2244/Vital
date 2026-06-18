/**
 * VITAL health model (Phase 2) — a lab-only scoring engine.
 *
 * Produces, from blood-panel data alone (no wearables, no questionnaires):
 *   • Biological Age   — Levine clinical PhenoAge (mortality-anchored)
 *   • Health Score     — 0–100 composite
 *   • Cardiometabolic  — 0–100
 *   • Longevity Score  — 0–100
 *   • Confidence       — 0–100 (coverage + recency + PhenoAge completeness)
 *
 * Recovery and Mental-Wellness scores are intentionally NOT computed here —
 * they require wearable / PROM inputs the lab model does not have.
 *
 * Everything is pure and deterministic. Specific PhenoAge coefficients are the
 * widely-used Levine et al. (2018) set; verify against the paper before any
 * clinical-sounding use.
 */
import type {
  CategoryScore,
  PhenoAgeResult,
  ScoreDriver,
  VitalScore,
} from './types/index.js';
import { ageFromDateOfBirth, scoreBand } from './vital-score.js';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─────────────────────────────────────────────────────────────────────────────
// Continuous marker health score (0–100)
// ─────────────────────────────────────────────────────────────────────────────

export interface MarkerRanges {
  optimal_low: number;
  optimal_high: number;
  normal_low: number;
  normal_high: number;
  min_plausible: number;
  max_plausible: number;
}

/**
 * Map a measured value to a 0–100 health score against its reference ranges.
 * Anchors: optimal window → 100, normal edges → 60, plausible edges → 0,
 * linearly interpolated between (continuous everywhere).
 */
export function markerHealthScore(value: number, r: MarkerRanges): number {
  const { optimal_low: oL, optimal_high: oH, normal_low: nL, normal_high: nH } = r;
  const minP = r.min_plausible;
  const maxP = r.max_plausible;
  if (value >= oL && value <= oH) return 100;
  if (value < oL) {
    if (value >= nL) return clamp(60 + 40 * ((value - nL) / (oL - nL || 1)), 60, 100);
    if (value >= minP) return clamp(60 * ((value - minP) / (nL - minP || 1)), 0, 60);
    return 0;
  }
  // value > oH
  if (value <= nH) return clamp(60 + 40 * ((nH - value) / (nH - oH || 1)), 60, 100);
  if (value <= maxP) return clamp(60 * ((maxP - value) / (maxP - nH || 1)), 0, 60);
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Levine clinical PhenoAge
// ─────────────────────────────────────────────────────────────────────────────

interface PhenoInput {
  key: string;
  slugs: string[]; // VITAL biomarker slug(s) that supply this input
  coef: number;
  /** Convert the value from VITAL's stored unit to the PhenoAge model unit. */
  toModelUnit: (v: number) => number;
  /** Population-typical value used to impute a missing marker (in VITAL units). */
  neutral: number;
}

/** The 9 biomarkers + their Levine coefficients, with VITAL unit conversions. */
const PHENO_INPUTS: PhenoInput[] = [
  { key: 'albumin', slugs: ['serum-albumin'], coef: -0.0336, toModelUnit: (v) => v * 10, neutral: 4.4 }, // g/dL→g/L
  { key: 'creatinine', slugs: ['creatinine'], coef: 0.0095, toModelUnit: (v) => v * 88.4017, neutral: 0.9 }, // mg/dL→µmol/L
  { key: 'glucose', slugs: ['fasting-glucose'], coef: 0.1953, toModelUnit: (v) => v / 18.0182, neutral: 97 }, // mg/dL→mmol/L
  {
    key: 'log_crp',
    slugs: ['hscrp-inflammation', 'hscrp-cardiac'],
    coef: 0.0954,
    toModelUnit: (v) => Math.log(Math.max(v / 10, 0.01)), // mg/L→mg/dL, then ln (floored)
    neutral: 1.8,
  },
  { key: 'lymphocyte_pct', slugs: ['lymphocytes'], coef: -0.012, toModelUnit: (v) => v, neutral: 30 },
  { key: 'mcv', slugs: ['mcv'], coef: 0.0268, toModelUnit: (v) => v, neutral: 90 },
  { key: 'rdw', slugs: ['rdw'], coef: 0.3306, toModelUnit: (v) => v, neutral: 13.5 },
  { key: 'alp', slugs: ['alp'], coef: 0.0019, toModelUnit: (v) => v, neutral: 70 },
  { key: 'wbc', slugs: ['wbc'], coef: 0.0554, toModelUnit: (v) => v, neutral: 6.5 }, // 10^3/µL
];

const PHENO_INTERCEPT = -19.9067;
const PHENO_AGE_COEF = 0.0804;
const PHENO_GAMMA = 0.0076927;
const PHENO_TMONTHS = 120; // 10-year mortality horizon
/** Below this many real markers we don't claim a biological age. */
const PHENO_MIN_REAL_MARKERS = 4;

/**
 * Compute Levine PhenoAge from a slug→value map and chronological age.
 * Missing markers are imputed at population-typical values and reported in
 * `imputed`; returns null when too few real markers are available.
 */
export function computePhenoAge(
  bySlug: Map<string, number>,
  chronologicalAge: number,
): PhenoAgeResult | null {
  let linComb = PHENO_INTERCEPT + PHENO_AGE_COEF * chronologicalAge;
  let realUsed = 0;
  const imputed: string[] = [];

  for (const input of PHENO_INPUTS) {
    let raw: number | undefined;
    for (const slug of input.slugs) {
      const v = bySlug.get(slug);
      if (v !== undefined && Number.isFinite(v)) {
        raw = v;
        break;
      }
    }
    if (raw === undefined) {
      raw = input.neutral;
      imputed.push(input.key);
    } else {
      realUsed += 1;
    }
    linComb += input.coef * input.toModelUnit(raw);
  }

  if (realUsed < PHENO_MIN_REAL_MARKERS) return null;

  // Gompertz 10-year mortality, then invert to phenotypic age.
  let m =
    1 - Math.exp((-Math.exp(linComb) * (Math.exp(PHENO_TMONTHS * PHENO_GAMMA) - 1)) / PHENO_GAMMA);
  m = clamp(m, 1e-6, 1 - 1e-6);
  const bioAge = 141.50225 + Math.log(-0.00553 * Math.log(1 - m)) / 0.090165;

  return {
    biological_age: Math.round(clamp(bioAge, 18, 120)),
    mortality_risk_10yr: m,
    markers_used: realUsed,
    markers_total: PHENO_INPUTS.length,
    imputed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full assessment
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthMarkerInput extends MarkerRanges {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  value: number | null; // null = untested
  tested_at?: string | null; // ISO date of the latest result, for recency
}

export interface AssessmentOptions {
  chronologicalAge?: number | null;
  dateOfBirth?: string | null;
  now?: Date;
}

/** Categories that make up the Cardiometabolic sub-score. */
const CARDIOMETABOLIC_CATEGORIES = new Set(['metabolic', 'cardiovascular', 'inflammatory']);

/** Map a biological-age delta (years) to a 0–100 score (younger = higher). */
function ageGapToScore(delta: number): number {
  return clamp(60 - 4 * delta, 0, 100); // −10y→100, 0→60, +10y→20
}

/** Weighted mean over present (non-null) components. */
function weightedMean(parts: Array<[number | null, number]>): number | null {
  let sum = 0;
  let wsum = 0;
  for (const [v, w] of parts) {
    if (v !== null) {
      sum += v * w;
      wsum += w;
    }
  }
  return wsum > 0 ? sum / wsum : null;
}

export function computeHealthAssessment(
  markers: HealthMarkerInput[],
  opts: AssessmentOptions = {},
): VitalScore {
  const now = opts.now ?? new Date();
  const age =
    opts.chronologicalAge ??
    (opts.dateOfBirth ? ageFromDateOfBirth(opts.dateOfBirth, now) : null);

  const totalCount = markers.length;
  const tested = markers.filter((m) => m.value !== null && Number.isFinite(m.value));
  const testedCount = tested.length;
  const coverage = totalCount > 0 ? testedCount / totalCount : 0;

  // Per-marker health scores.
  const scored = tested.map((m) => ({
    slug: m.slug,
    name: m.name,
    category: m.categoryName,
    categorySlug: m.categorySlug,
    score: markerHealthScore(m.value as number, m),
  }));

  // Per-category aggregation.
  const byCat = new Map<string, { name: string; sum: number; tested: number; total: number }>();
  for (const m of markers) {
    const e =
      byCat.get(m.categorySlug) ??
      byCat.set(m.categorySlug, { name: m.categoryName, sum: 0, tested: 0, total: 0 }).get(
        m.categorySlug,
      )!;
    e.total += 1;
  }
  for (const s of scored) {
    const e = byCat.get(s.categorySlug)!;
    e.sum += s.score;
    e.tested += 1;
  }

  const categoryScores: CategoryScore[] = [];
  const cardioCatScores: number[] = [];
  const allCatScores: number[] = [];
  for (const [slug, e] of byCat) {
    if (e.tested === 0) {
      categoryScores.push({ slug, name: e.name, score: 0, band: 'attention', tested: 0, total: e.total });
      continue;
    }
    const catScore = Math.round(e.sum / e.tested);
    allCatScores.push(catScore);
    if (CARDIOMETABOLIC_CATEGORIES.has(slug)) cardioCatScores.push(catScore);
    categoryScores.push({
      slug,
      name: e.name,
      score: catScore,
      band: scoreBand(catScore).band,
      tested: e.tested,
      total: e.total,
    });
  }
  categoryScores.sort((a, b) => (b.tested > 0 ? b.score : -1) - (a.tested > 0 ? a.score : -1));

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const overallHealth = mean(allCatScores); // category-weighted biomarker health
  const cardiometabolic = mean(cardioCatScores);

  // Biological age via PhenoAge.
  const bySlug = new Map<string, number>();
  for (const m of tested) bySlug.set(m.slug, m.value as number);
  const phenoage = age !== null ? computePhenoAge(bySlug, age) : null;
  const biologicalAge = phenoage?.biological_age ?? null;
  const ageDelta = biologicalAge !== null && age !== null ? biologicalAge - age : null;
  const ageGapScore = ageDelta !== null ? ageGapToScore(ageDelta) : null;

  // Composite Health Score (renormalized over present components).
  const healthRaw = weightedMean([
    [overallHealth, 0.4],
    [cardiometabolic, 0.3],
    [ageGapScore, 0.3],
  ]);
  const health = healthRaw !== null ? Math.round(healthRaw) : 0;

  // Longevity Score.
  const longevityRaw = weightedMean([
    [ageGapScore, 0.5],
    [cardiometabolic, 0.25],
    [overallHealth, 0.25],
  ]);
  const longevity = longevityRaw !== null ? Math.round(longevityRaw) : null;

  // Confidence: coverage + PhenoAge completeness + recency.
  let recency = 0;
  const dates = tested
    .map((m) => (m.tested_at ? new Date(m.tested_at).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  if (dates.length > 0) {
    const newest = Math.max(...dates);
    const days = Math.max(0, (now.getTime() - newest) / 86_400_000);
    recency = Math.exp(-days / 365); // ~1 today, ~0.37 at one year
  }
  const phenoCompleteness = phenoage ? phenoage.markers_used / phenoage.markers_total : 0;
  const confidence = Math.round(
    100 * (0.45 * coverage + 0.3 * phenoCompleteness + 0.25 * recency),
  );

  // Drivers: best and worst tested markers.
  const negative: ScoreDriver[] = scored
    .filter((s) => s.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ slug, name, category, score }) => ({ slug, name, category, score: Math.round(score) }));
  const positive: ScoreDriver[] = scored
    .filter((s) => s.score >= 90)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ slug, name, category, score }) => ({ slug, name, category, score: Math.round(score) }));

  return {
    score: health,
    band: scoreBand(health).band,
    tested_count: testedCount,
    total_count: totalCount,
    coverage,
    confidence,
    category_scores: categoryScores,
    cardiometabolic_score: cardiometabolic !== null ? Math.round(cardiometabolic) : null,
    longevity_score: longevity,
    chronological_age: age,
    biological_age: biologicalAge,
    age_delta: ageDelta,
    phenoage,
    drivers: { positive, negative },
    computed_at: now.toISOString(),
  };
}
