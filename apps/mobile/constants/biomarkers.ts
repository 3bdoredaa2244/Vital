/**
 * Re-exports the canonical biomarker dataset from @vital/shared. The app uses
 * the API as the source of truth at runtime, but these definitions back
 * offline fallbacks, search seeds, and the manual-entry plausibility windows.
 */
import { BIOMARKER_SEED } from '@vital/shared/data/biomarkers';
import type { BiomarkerSeed } from '@vital/shared/data/types';

export const BIOMARKERS: BiomarkerSeed[] = BIOMARKER_SEED;

export const BIOMARKER_BY_SLUG: Record<string, BiomarkerSeed> = Object.fromEntries(
  BIOMARKERS.map((b) => [b.slug, b]),
);

export const HEALTH_GOAL_OPTIONS = [
  { value: 'optimize_energy', label: 'Optimize energy levels', icon: 'Zap' },
  { value: 'metabolic_health', label: 'Improve metabolic health', icon: 'Flame' },
  { value: 'balance_hormones', label: 'Balance hormones', icon: 'Activity' },
  { value: 'reduce_inflammation', label: 'Reduce inflammation', icon: 'Gauge' },
  { value: 'longevity', label: 'Longevity & prevention', icon: 'Hourglass' },
  { value: 'athletic_performance', label: 'Athletic performance', icon: 'Dumbbell' },
  { value: 'weight_management', label: 'Weight management', icon: 'Scale' },
  { value: 'general_awareness', label: 'General health awareness', icon: 'HeartPulse' },
] as const;
