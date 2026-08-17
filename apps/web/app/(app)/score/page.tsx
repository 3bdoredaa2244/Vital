'use client';

/**
 * VITAL Score — the hero, per-category contributions, what's moving the score,
 * biological age detail, and the recorded history.
 */
import type { CategoryScore, ScoreDriver } from '@vital/shared';
import { scoreBand } from '@vital/shared';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { ScoreHero } from '@/components/ScoreHero';
import { SubscriptionGate } from '@/components/states';
import {
  Button,
  Card,
  DataRow,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { scoreApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';

function CategoryRow({ cat }: { cat: CategoryScore }) {
  const band = scoreBand(cat.score);
  return (
    <div className="flex items-center gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-ink">{cat.name}</div>
        <div className="text-xs text-inkMuted">
          {cat.tested} of {cat.total} tested
        </div>
      </div>
      <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-sm bg-line sm:w-40">
        <span
          className="block h-full rounded-sm"
          style={{ width: `${Math.round(cat.score)}%`, backgroundColor: band.color }}
        />
      </div>
      <div className="w-10 shrink-0 text-right font-display text-lg" style={{ color: band.color }}>
        {Math.round(cat.score)}
      </div>
    </div>
  );
}

function DriverList({
  title,
  drivers,
  positive,
}: {
  title: string;
  drivers: ScoreDriver[];
  positive: boolean;
}) {
  if (drivers.length === 0) return null;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        {positive ? (
          <TrendingUp size={16} className="text-green" />
        ) : (
          <TrendingDown size={16} className="text-rust" />
        )}
        <span className="vital-eyebrow text-inkSoft">{title}</span>
      </div>
      <ul className="space-y-2">
        {drivers.map((d) => (
          <li key={d.slug} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-ink">{d.name}</span>
            <span
              className="shrink-0 font-display text-base"
              style={{ color: positive ? '#3E7A53' : '#C2603C' }}
            >
              {Math.round(d.score)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ScorePage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;

  const score = useApi(() => scoreApi.get(), [], enabled);
  const history = useApi(() => scoreApi.history(), [], enabled);

  if (subscriptionLoaded && !hasActiveSubscription) {
    return (
      <div>
        <PageHeader eyebrow="Health" title="VITAL Score" />
        <Card>
          <SubscriptionGate feature="your VITAL Score and biological age" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Health"
        title="VITAL Score"
        subtitle="A single 0–100 read on your labs, with the categories and markers driving it."
      />

      {score.loading ? (
        <div className="space-y-4">
          <Card className="p-6">
            <Skeleton width="30%" height={11} />
            <div className="mt-5 flex items-center gap-5">
              <Skeleton width={132} height={132} radius={66} />
              <div className="flex-1">
                <Skeleton width="50%" height={22} />
                <div className="h-3" />
                <Skeleton width="70%" height={13} />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton width="25%" height={11} />
            <div className="h-4" />
            <Skeleton height={120} />
          </Card>
        </div>
      ) : score.error ? (
        score.error.kind === 'forbidden' ? (
          <Card>
            <SubscriptionGate feature="your VITAL Score and biological age" />
          </Card>
        ) : (
          <ErrorState message={score.error.message} onRetry={score.reload} />
        )
      ) : score.data ? (
        (() => {
          const s = score.data.score;
          return (
            <div className="space-y-6">
              <ScoreHero score={s} history={history.data?.history ?? []} />

              {s.tested_count === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Activity size={26} />}
                    title="No results yet"
                    message="Your VITAL Score is calculated from your blood markers. Book a home draw or add a result to get started."
                    action={
                      <Link href="/bookings/new">
                        <Button>Book a test</Button>
                      </Link>
                    }
                  />
                </Card>
              ) : (
                <>
                  <section>
                    <SectionHeader
                      title="By category"
                      subtitle="How each area of your physiology is scoring."
                    />
                    <Card className="px-5 py-2">
                      {s.category_scores.length === 0 ? (
                        <p className="py-6 text-sm text-inkSoft">
                          No category scores yet — they appear once markers in each category are
                          tested.
                        </p>
                      ) : (
                        s.category_scores.map((c) => <CategoryRow key={c.slug} cat={c} />)
                      )}
                    </Card>
                  </section>

                  {s.drivers.positive.length > 0 || s.drivers.negative.length > 0 ? (
                    <section>
                      <SectionHeader
                        title="What's moving your score"
                        subtitle="The markers contributing most, in both directions."
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DriverList title="Helping" drivers={s.drivers.positive} positive />
                        <DriverList
                          title="Holding you back"
                          drivers={s.drivers.negative}
                          positive={false}
                        />
                      </div>
                    </section>
                  ) : null}

                  {s.phenoage ? (
                    <section>
                      <SectionHeader
                        title="Biological age"
                        subtitle="Levine PhenoAge, computed from your lab panel."
                      />
                      <Card className="px-5 py-2">
                        <DataRow label="Biological age" value={`${s.phenoage.biological_age} years`} />
                        <DataRow
                          label="Chronological age"
                          value={s.chronological_age != null ? `${s.chronological_age} years` : '—'}
                        />
                        <DataRow
                          label="Markers used"
                          value={`${s.phenoage.markers_used} of ${s.phenoage.markers_total}`}
                        />
                        {s.phenoage.imputed.length > 0 ? (
                          <DataRow
                            label="Estimated markers"
                            value={
                              <span className="text-inkSoft">{s.phenoage.imputed.join(', ')}</span>
                            }
                          />
                        ) : null}
                        <DataRow label="Confidence" value={`${s.confidence}%`} />
                      </Card>
                      <p className="mt-2 text-xs leading-relaxed text-inkMuted">
                        Biological age is an estimate from a published model, not a clinical
                        diagnosis. Markers we don&apos;t have are estimated, which lowers confidence.
                      </p>
                    </section>
                  ) : null}

                  <section>
                    <SectionHeader title="History" subtitle="Every recorded snapshot of your score." />
                    {history.loading ? (
                      <Skeleton height={80} />
                    ) : (history.data?.history.length ?? 0) === 0 ? (
                      <Card className="p-6 text-sm text-inkSoft">
                        No snapshots recorded yet. Your score is saved each time new results arrive.
                      </Card>
                    ) : (
                      <Card className="divide-y divide-line">
                        {history.data!.history.map((h) => {
                          const b = scoreBand(h.score);
                          return (
                            <div key={h.id} className="flex items-center justify-between px-5 py-3">
                              <div>
                                <div className="text-sm text-ink">{formatDate(h.recorded_on)}</div>
                                <div className="text-xs text-inkMuted">
                                  {h.tested_count} of {h.total_count} markers
                                  {h.biological_age != null ? ` · bio age ${h.biological_age}` : ''}
                                </div>
                              </div>
                              <span className="font-display text-2xl" style={{ color: b.color }}>
                                {h.score}
                              </span>
                            </div>
                          );
                        })}
                      </Card>
                    )}
                  </section>
                </>
              )}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
