/**
 * VITAL — Biomarker status classification (shared)
 *
 * The single canonical implementation used by both the API (to compute
 * `status` on list/detail responses) and the mobile client (for instant
 * UI feedback on manual entries). Keeping one copy avoids client/server drift.
 */
import type { Biomarker, BiomarkerStatus } from './types/index.js';

type RangeFields = Pick<
  Biomarker,
  'optimal_low' | 'optimal_high' | 'normal_low' | 'normal_high'
>;

/**
 * Overlay a patient's own lab reference range onto a marker's bounds so
 * classification and scoring reflect their age + sex. The lab prints ranges
 * specific to the patient's demographic, so when we captured one we treat it
 * as the authoritative "normal" window and keep VITAL's optimal target clamped
 * inside it. With no captured range, the marker's generic bounds are returned
 * unchanged. Numbers are never invented — they come straight from the lab.
 */
export function applyLabRange<T extends RangeFields>(
  ranges: T,
  ref: { ref_low: number | null; ref_high: number | null },
): T {
  if (ref.ref_low == null && ref.ref_high == null) return ranges;
  const lo = Math.min(ref.ref_low ?? ranges.normal_low, ref.ref_high ?? ranges.normal_high);
  const hi = Math.max(ref.ref_low ?? ranges.normal_low, ref.ref_high ?? ranges.normal_high);
  const clamp = (v: number) => Math.min(Math.max(v, lo), hi);
  return { ...ranges, normal_low: lo, normal_high: hi, optimal_low: clamp(ranges.optimal_low), optimal_high: clamp(ranges.optimal_high) };
}

/**
 * Classify a measured value against a biomarker's reference ranges.
 *
 * - `optimal`    → within VITAL's functional-medicine optimal window
 * - `suboptimal` → within the standard lab normal window but outside optimal
 * - `alert`      → outside the normal window entirely
 *
 * `untested` is never returned here — it is the state when no value exists,
 * and callers should handle the absence of a value before calling this.
 */
export function classifyBiomarker(
  value: number,
  biomarker: RangeFields,
): Exclude<BiomarkerStatus, 'untested'> {
  if (value >= biomarker.optimal_low && value <= biomarker.optimal_high) {
    return 'optimal';
  }
  if (value >= biomarker.normal_low && value <= biomarker.normal_high) {
    return 'suboptimal';
  }
  return 'alert';
}

/** Convenience: returns 'untested' when value is null/undefined. */
export function classifyBiomarkerSafe(
  value: number | null | undefined,
  biomarker: RangeFields,
): BiomarkerStatus {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'untested';
  }
  return classifyBiomarker(value, biomarker);
}

/** Canonical status → color map used across the whole app (warm-paper palette).
 *  Keep these in sync with the mobile theme tokens (apps/mobile/constants/tokens.js). */
export const STATUS_COLORS: Record<BiomarkerStatus, string> = {
  optimal: '#6FA97D',
  suboptimal: '#CDA24E',
  alert: '#C2603C',
  untested: '#B6AD9C',
};

export const STATUS_LABELS: Record<BiomarkerStatus, string> = {
  optimal: 'Optimal',
  suboptimal: 'Review',
  alert: 'Alert',
  untested: 'Untested',
};
