/**
 * VITAL Score — band thresholds and age helpers shared by the health model.
 * The scoring engine itself lives in `health-model.ts`.
 */
import type { ISODateString, ScoreBand } from './types/index.js';

/** Band thresholds (inclusive lower bound), highest first. */
export const SCORE_BANDS: ReadonlyArray<{
  band: ScoreBand;
  min: number;
  label: string;
  color: string;
}> = [
  { band: 'excellent', min: 85, label: 'Excellent', color: '#6FA97D' },
  { band: 'good', min: 70, label: 'Good', color: '#3E7A53' },
  { band: 'fair', min: 50, label: 'Fair', color: '#CDA24E' },
  { band: 'attention', min: 0, label: 'Needs attention', color: '#C2603C' },
];

/** Map a 0–100 score to its band descriptor. */
export function scoreBand(score: number): (typeof SCORE_BANDS)[number] {
  const clamped = Math.max(0, Math.min(100, score));
  return SCORE_BANDS.find((b) => clamped >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]!;
}

/** Whole years between a date of birth and `now`. */
export function ageFromDateOfBirth(
  dateOfBirth: ISODateString,
  now: Date = new Date(),
): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}
