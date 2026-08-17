'use client';

/**
 * Biomarker library — search, category filter, status filter, and a grid/list
 * toggle. Mirrors the mobile biomarkers tab; the web version filters client
 * side over the full list so switching filters is instant.
 */
import type { BiomarkerStatus } from '@vital/shared';
import { STATUS_LABELS } from '@vital/shared';
import { FlaskConical, LayoutGrid, List, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { BiomarkerCard } from '@/components/BiomarkerCard';
import { AsyncSection } from '@/components/states';
import { EmptyState, Input, PageHeader, SkeletonList } from '@/components/ui';
import { biomarkerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { statusColors } from '@/lib/theme';
import { useApi } from '@/lib/use-api';

const STATUS_FILTERS: (BiomarkerStatus | 'all')[] = [
  'all',
  'optimal',
  'suboptimal',
  'alert',
  'untested',
];

function FilterPill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-eyebrow transition ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-line bg-panel text-inkSoft hover:border-accentSoft hover:text-ink'
      }`}
    >
      {color ? (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      {children}
    </button>
  );
}

function BiomarkersInner() {
  const params = useSearchParams();
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(params.get('category') ?? 'all');
  const [status, setStatus] = useState<BiomarkerStatus | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('list');

  // Fetch once with a high limit, then filter locally — the catalog is ~80
  // markers, so this is cheaper than a request per keystroke.
  const library = useApi(() => biomarkerApi.list({ limit: 200 }), [], enabled);

  const filtered = useMemo(() => {
    const all = library.data?.biomarkers ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((b) => {
      if (category !== 'all' && (b.category?.slug ?? '') !== category) return false;
      if (status !== 'all' && b.status !== status) return false;
      if (term && !b.name.toLowerCase().includes(term) && !b.slug.includes(term)) return false;
      return true;
    });
  }, [library.data, search, category, status]);

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Biomarkers"
        subtitle="Every marker VITAL tracks, with your latest result and where it sits against the optimal range."
      />

      <AsyncSection
        state={library}
        feature="the full biomarker library and your results"
        loading={<SkeletonList count={8} />}
      >
        {(data) => (
          <>
            {/* Controls */}
            <div className="mb-5 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkMuted"
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search markers…"
                    className="pl-10"
                    aria-label="Search biomarkers"
                  />
                </div>
                <div className="flex shrink-0 overflow-hidden rounded-md border border-line">
                  <button
                    onClick={() => setView('list')}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    className={`px-3 transition ${view === 'list' ? 'bg-panel text-accent' : 'text-inkMuted hover:text-ink'}`}
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={`border-l border-line px-3 transition ${view === 'grid' ? 'bg-panel text-accent' : 'text-inkMuted hover:text-ink'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterPill active={category === 'all'} onClick={() => setCategory('all')}>
                  All categories
                </FilterPill>
                {data.categories.map((c) => (
                  <FilterPill
                    key={c.id}
                    active={category === c.slug}
                    onClick={() => setCategory(c.slug)}
                    color={c.color}
                  >
                    {c.name}
                  </FilterPill>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((s) => (
                  <FilterPill
                    key={s}
                    active={status === s}
                    onClick={() => setStatus(s)}
                    color={s === 'all' ? undefined : statusColors[s]}
                  >
                    {s === 'all' ? 'All statuses' : STATUS_LABELS[s]}
                  </FilterPill>
                ))}
              </div>
            </div>

            <p className="mb-3 text-xs text-inkMuted">
              {filtered.length} of {data.biomarkers.length} markers
            </p>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<FlaskConical size={26} />}
                title="No markers match"
                message="Try a different search term, category, or status filter."
              />
            ) : view === 'grid' ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((b) => (
                  <BiomarkerCard key={b.id} biomarker={b} view="grid" highlight={search.trim()} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((b) => (
                  <BiomarkerCard key={b.id} biomarker={b} view="list" highlight={search.trim()} />
                ))}
              </div>
            )}
          </>
        )}
      </AsyncSection>
    </div>
  );
}

export default function BiomarkersPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<SkeletonList count={8} />}>
      <BiomarkersInner />
    </Suspense>
  );
}
