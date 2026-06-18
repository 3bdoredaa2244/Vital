/**
 * Re-exports the canonical category dataset from @vital/shared so the mobile
 * app and API never diverge. Also exposes a slug→meta lookup for convenience.
 */
import { CATEGORY_SEED } from '@vital/shared/data/biomarkers';
import type { CategorySeed } from '@vital/shared/data/types';

export const CATEGORIES: CategorySeed[] = CATEGORY_SEED;

export const CATEGORY_BY_SLUG: Record<string, CategorySeed> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);
