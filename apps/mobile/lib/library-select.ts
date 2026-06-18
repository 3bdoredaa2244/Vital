/**
 * Pure helpers for filtering, searching, sorting, and summarising the biomarker
 * library on the client.
 */
import type { BiomarkerStatus, BiomarkerWithResult } from '@vital/shared';

import type { SortKey, StatusFilter } from './store/biomarkers';

export interface CategorySummary {
  total: number;
  optimal: number;
  suboptimal: number;
  alert: number;
  untested: number;
}

const STATUS_RANK: Record<BiomarkerStatus, number> = {
  alert: 0,
  suboptimal: 1,
  optimal: 2,
  untested: 3,
};

export function filterBiomarkers(
  biomarkers: BiomarkerWithResult[],
  opts: { category: string; status: StatusFilter; search: string },
): BiomarkerWithResult[] {
  const term = opts.search.trim().toLowerCase();
  return biomarkers.filter((b) => {
    if (opts.category !== 'all' && b.category?.slug !== opts.category) {
      // category may be undefined on list responses; fall back to matching none
      if (!b.category) return false;
    }
    if (opts.status !== 'all' && b.status !== opts.status) return false;
    if (term) {
      const haystack = `${b.name} ${b.description} ${b.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function sortBiomarkers(
  biomarkers: BiomarkerWithResult[],
  sort: SortKey,
): BiomarkerWithResult[] {
  const copy = [...biomarkers];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'status':
      return copy.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
    case 'last_tested':
      return copy.sort((a, b) => {
        const at = a.latest_result?.tested_at ?? '';
        const bt = b.latest_result?.tested_at ?? '';
        return bt.localeCompare(at);
      });
    case 'category':
    default:
      return copy.sort(
        (a, b) =>
          (a.category?.display_order ?? 99) - (b.category?.display_order ?? 99) ||
          a.display_order - b.display_order,
      );
  }
}

export function summariseByCategory(
  biomarkers: BiomarkerWithResult[],
): Record<string, CategorySummary> {
  const out: Record<string, CategorySummary> = {};
  for (const b of biomarkers) {
    const slug = b.category?.slug;
    if (!slug) continue;
    const s =
      out[slug] ?? (out[slug] = { total: 0, optimal: 0, suboptimal: 0, alert: 0, untested: 0 });
    s.total += 1;
    s[b.status] += 1;
  }
  return out;
}
