/**
 * Shapes for the canonical seed dataset that lives in `@vital/shared/data`.
 * The dataset is the single source of truth consumed by both the API seed
 * script and the mobile `constants/` re-exports.
 */
import type { CategorySlug } from '../types/index.js';

export interface CategorySeed {
  name: string;
  slug: CategorySlug;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  display_order: number;
}

export interface BiomarkerSeed {
  /** Slug of the owning category (resolved to category_id at seed time). */
  category: CategorySlug;
  name: string;
  slug: string;
  unit: string;
  description: string;
  why_it_matters: string;
  what_affects_it: string;
  optimal_low: number;
  optimal_high: number;
  normal_low: number;
  normal_high: number;
  min_plausible: number;
  max_plausible: number;
  display_order: number;
  tags: string[];
}
