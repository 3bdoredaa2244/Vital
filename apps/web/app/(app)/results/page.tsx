'use client';

/**
 * Results — every recorded value across all markers, newest first, with the
 * marker name resolved from the biomarker catalog and a link to its detail.
 */
import type { Biomarker } from '@vital/shared';
import { classifyBiomarkerSafe } from '@vital/shared';
import { TestTube, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SkeletonList,
  StatusBadge,
} from '@/components/ui';
import { biomarkerApi, resultApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatNumber } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

export default function ResultsPage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const results = useApi(() => resultApi.all(), [], enabled);
  // The results endpoint returns marker ids only, so we join against the
  // catalog to show names, units, and a computed status.
  const library = useApi(() => biomarkerApi.list({ limit: 200 }), [], enabled);

  const markerById = useMemo(() => {
    const map = new Map<string, Biomarker>();
    for (const b of library.data?.biomarkers ?? []) map.set(b.id, b);
    return map;
  }, [library.data]);

  const rows = useMemo(() => {
    const all = results.data?.results ?? [];
    const term = search.trim().toLowerCase();
    return all
      .map((r) => ({ result: r, marker: markerById.get(r.biomarker_id) }))
      .filter(({ marker }) => !term || (marker?.name.toLowerCase().includes(term) ?? false))
      .sort(
        (a, b) => new Date(b.result.tested_at).getTime() - new Date(a.result.tested_at).getTime(),
      );
  }, [results.data, markerById, search]);

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await resultApi.remove(id);
      toast.success('Result removed.');
      results.reload();
    } catch (err) {
      toast.error(messageFor(err, 'Could not remove that result.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Your data"
        title="Results"
        subtitle="Every value on record, whether you entered it, a lab uploaded it, or the VITAL team added it."
      />

      <AsyncSection
        state={results}
        feature="your recorded results"
        loading={<SkeletonList count={8} />}
        isEmpty={(d) => d.results.length === 0}
        empty={
          <EmptyState
            icon={<TestTube size={26} />}
            title="No results yet"
            message="Book a home blood draw, or add a result manually from any biomarker page."
            action={
              <div className="flex gap-3">
                <Link href="/bookings/new">
                  <Button>Book a test</Button>
                </Link>
                <Link href="/biomarkers">
                  <Button variant="secondary">Browse markers</Button>
                </Link>
              </div>
            }
          />
        }
      >
        {(data) => (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by marker…"
                aria-label="Search results"
                className="max-w-xs"
              />
              <p className="text-xs text-inkMuted">
                {rows.length} of {data.results.length} results
              </p>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={<TestTube size={26} />}
                title="No matching results"
                message="Try a different marker name."
              />
            ) : (
              <Card className="divide-y divide-line">
                {rows.map(({ result, marker }) => {
                  const status = marker
                    ? classifyBiomarkerSafe(result.value, marker)
                    : 'untested';
                  return (
                    <div key={result.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        {marker ? (
                          <Link
                            href={`/biomarkers/${marker.id}`}
                            className="truncate font-display text-[17px] text-ink transition hover:text-accent"
                          >
                            {marker.name}
                          </Link>
                        ) : (
                          <span className="font-display text-[17px] text-inkSoft">
                            Unknown marker
                          </span>
                        )}
                        <div className="truncate text-xs text-inkMuted">
                          {formatDate(result.tested_at)}
                          {result.lab_name ? ` · ${result.lab_name}` : ''}
                          {` · ${result.source}`}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-display text-lg text-ink">
                          {formatNumber(result.value)}
                          <span className="ml-1 font-sans text-[11px] text-inkSoft">
                            {marker?.unit ?? ''}
                          </span>
                        </div>
                      </div>

                      {marker ? <StatusBadge status={status} size="sm" /> : null}

                      {result.source === 'manual' ? (
                        <button
                          onClick={() => void onDelete(result.id)}
                          disabled={deletingId === result.id}
                          aria-label="Delete result"
                          className="shrink-0 rounded-sm p-1.5 text-inkMuted transition hover:bg-rust/10 hover:text-rust disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="w-[30px] shrink-0" aria-hidden />
                      )}
                    </div>
                  );
                })}
              </Card>
            )}
          </>
        )}
      </AsyncSection>
    </div>
  );
}
