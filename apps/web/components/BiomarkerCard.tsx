'use client';

/**
 * Biomarker row / tile for the library. Mirrors the mobile BiomarkerCard:
 * category colour dot, name, latest value + date, and a status pill.
 */
import type { BiomarkerWithResult } from '@vital/shared';
import Link from 'next/link';

import { formatDate, formatNumber } from '@/lib/format';
import { statusColors } from '@/lib/theme';
import { InteractiveCard, StatusBadge } from './ui';

function HighlightedName({ name, term }: { name: string; term?: string }) {
  if (!term) return <>{name}</>;
  const idx = name.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <span className="text-accent">{name.slice(idx, idx + term.length)}</span>
      {name.slice(idx + term.length)}
    </>
  );
}

export function BiomarkerCard({
  biomarker,
  view = 'list',
  highlight,
}: {
  biomarker: BiomarkerWithResult;
  view?: 'grid' | 'list';
  highlight?: string;
}) {
  const dotColor = biomarker.category?.color ?? statusColors[biomarker.status];
  const result = biomarker.latest_result;

  if (view === 'grid') {
    return (
      <Link href={`/biomarkers/${biomarker.id}`} className="block h-full">
        <InteractiveCard className="flex h-full min-h-[130px] flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusColors[biomarker.status] }}
            />
          </div>
          <div className="font-display text-[17px] leading-snug text-ink">
            <HighlightedName name={biomarker.name} term={highlight} />
          </div>
          <div className="mt-auto pt-3">
            {result ? (
              <div className="font-display text-2xl text-ink">
                {formatNumber(result.value)}
                <span className="ml-1 font-sans text-[11px] text-inkSoft">{biomarker.unit}</span>
              </div>
            ) : (
              <div className="font-mono text-[11px] uppercase tracking-eyebrow text-inkMuted">
                Untested · {biomarker.unit}
              </div>
            )}
          </div>
        </InteractiveCard>
      </Link>
    );
  }

  return (
    <Link href={`/biomarkers/${biomarker.id}`} className="block">
      <InteractiveCard className="flex items-center gap-3 p-4">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[17px] text-ink">
            <HighlightedName name={biomarker.name} term={highlight} />
          </div>
          <div className="truncate text-[11px] text-inkSoft">
            {result
              ? `${formatNumber(result.value)} ${biomarker.unit} · ${formatDate(result.tested_at)}`
              : `${biomarker.unit} · not tested`}
          </div>
        </div>
        <StatusBadge status={biomarker.status} size="sm" />
      </InteractiveCard>
    </Link>
  );
}
