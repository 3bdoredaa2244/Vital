'use client';

/**
 * Dashboard — the web adaptation of the mobile dashboard.
 *
 * Same content, same order, same terminology: greeting → status breakdown →
 * VITAL Score → quick entries (Score / AI / Recommendations / Book a test) →
 * plan summary → category summaries. The desktop layout puts the score hero
 * and the breakdown side by side instead of stacking them.
 *
 * Everything here is real API data. When the user has no active subscription
 * the API returns 403 for the data routes, and we show the same "Start your
 * health journey" gate the mobile app shows.
 */
import type { BiomarkerCategory, BiomarkerWithResult } from '@vital/shared';
import {
  Activity,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { ScoreHero } from '@/components/ScoreHero';
import { SubscriptionGate } from '@/components/states';
import {
  Card,
  Eyebrow,
  InteractiveCard,
  SectionHeader,
  Skeleton,
  SkeletonCards,
} from '@/components/ui';
import { aiApi, biomarkerApi, scoreApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { statusColors } from '@/lib/theme';
import { useApi } from '@/lib/use-api';

interface CategorySummary {
  total: number;
  optimal: number;
  suboptimal: number;
  alert: number;
  untested: number;
}

function summariseByCategory(
  biomarkers: BiomarkerWithResult[],
  categories: BiomarkerCategory[],
): Record<string, CategorySummary> {
  const byId = new Map(categories.map((c) => [c.id, c.slug]));
  const out: Record<string, CategorySummary> = {};
  for (const b of biomarkers) {
    const slug = b.category?.slug ?? byId.get(b.category_id);
    if (!slug) continue;
    out[slug] ??= { total: 0, optimal: 0, suboptimal: 0, alert: 0, untested: 0 };
    out[slug]!.total += 1;
    out[slug]![b.status] += 1;
  }
  return out;
}

function QuickEntry({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="block">
      <InteractiveCard className="flex items-center gap-3 p-4">
        <span className="text-accent">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base text-ink">{title}</span>
          <span className="block truncate text-xs text-inkSoft">{subtitle}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-inkMuted" />
      </InteractiveCard>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, subscription, hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;

  const library = useApi(() => biomarkerApi.list({ limit: 200 }), [], enabled);
  const score = useApi(() => scoreApi.get(), [], enabled);
  const history = useApi(() => scoreApi.history(), [], enabled);
  // AI status is public — it tells us whether to surface the VITAL AI entry.
  const aiStatus = useApi(() => aiApi.status(), []);

  const biomarkers = library.data?.biomarkers ?? [];
  const categories = library.data?.categories ?? [];

  const counts = useMemo(() => {
    const c = { optimal: 0, suboptimal: 0, alert: 0, untested: 0 };
    for (const b of biomarkers) c[b.status] += 1;
    return c;
  }, [biomarkers]);

  const summaries = useMemo(
    () => summariseByCategory(biomarkers, categories),
    [biomarkers, categories],
  );

  const tested = counts.optimal + counts.suboptimal + counts.alert;
  const maxCount = Math.max(counts.optimal, counts.suboptimal, counts.alert, 1);
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const aiEnabled = aiStatus.data?.status.enabled ?? false;

  return (
    <div>
      <header className="mb-7">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="mt-1 font-display text-4xl leading-tight text-ink sm:text-5xl">{firstName}</h1>
      </header>

      {subscriptionLoaded && !hasActiveSubscription ? (
        <Card>
          <SubscriptionGate feature="your VITAL Score, 80+ biomarkers, results and home blood draws" />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-5">
            {/* VITAL Score hero */}
            <div className="lg:col-span-3">
              {score.loading || history.loading ? (
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
              ) : score.data ? (
                <ScoreHero score={score.data.score} history={history.data?.history ?? []} />
              ) : (
                <Card className="p-6">
                  <Eyebrow tone="soft">VITAL Score</Eyebrow>
                  <p className="mt-3 text-sm text-inkSoft">
                    Your score will appear once your first results are in.
                  </p>
                </Card>
              )}
            </div>

            {/* Status breakdown — the mobile count-bar hero */}
            <div className="lg:col-span-2">
              {library.loading ? (
                <Card className="h-full p-5">
                  <Skeleton width="35%" height={11} />
                  <div className="mt-6 flex h-[140px] items-end gap-4">
                    <Skeleton width="30%" height={90} />
                    <Skeleton width="30%" height={60} />
                    <Skeleton width="30%" height={40} />
                  </div>
                </Card>
              ) : tested > 0 ? (
                <Link href="/biomarkers" className="block h-full">
                  <InteractiveCard className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Eyebrow>Biomarkers</Eyebrow>
                      <ChevronRight size={16} className="text-inkMuted" />
                    </div>
                    <div className="flex flex-1 items-end justify-between gap-3" style={{ minHeight: 150 }}>
                      {[
                        { label: 'Optimal', n: counts.optimal, c: statusColors.optimal },
                        { label: 'Review', n: counts.suboptimal, c: statusColors.suboptimal },
                        { label: 'Out of Range', n: counts.alert, c: statusColors.alert },
                      ].map((b) => (
                        <div key={b.label} className="flex flex-1 flex-col items-center justify-end">
                          <span className="font-display text-3xl" style={{ color: b.c }}>
                            {b.n}
                          </span>
                          <span className="mb-2 mt-0.5 text-center text-xs text-inkSoft">{b.label}</span>
                          <span
                            className="w-2/3 rounded-lg"
                            style={{
                              backgroundColor: b.c,
                              height: Math.max(8, (b.n / maxCount) * 84),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-inkSoft">
                      <span className="font-semibold text-ink">{counts.optimal}</span> of {tested}{' '}
                      markers optimal
                    </p>
                  </InteractiveCard>
                </Link>
              ) : (
                <Card className="flex h-full flex-col justify-center p-5 text-center">
                  <Eyebrow className="text-left">Biomarkers</Eyebrow>
                  <p className="mt-4 text-sm text-inkSoft">
                    No results yet. Book a test or add a result to see your breakdown.
                  </p>
                  <Link
                    href="/bookings/new"
                    className="mt-4 inline-block text-[13px] text-accent hover:underline"
                  >
                    Book a test →
                  </Link>
                </Card>
              )}
            </div>
          </div>

          {/* Quick entries — same set and order as the mobile dashboard */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickEntry
              href="/score"
              icon={<Activity size={20} />}
              title="VITAL Score"
              subtitle="Your overall health score & trend"
            />
            {aiEnabled ? (
              <QuickEntry
                href="/ai"
                icon={<Sparkles size={20} />}
                title="VITAL AI"
                subtitle="Insights & answers from your results"
              />
            ) : null}
            <QuickEntry
              href="/recommendations"
              icon={<ClipboardList size={20} />}
              title="Recommendations"
              subtitle="Supplements & lifestyle tailored to you"
            />
            <QuickEntry
              href="/bookings/new"
              icon={<CalendarCheck size={20} />}
              title="Book a Test"
              subtitle="Schedule a home blood draw near you"
            />
          </div>

          {/* Plan summary */}
          {subscription ? (
            <Card className="mt-4 p-4">
              <Eyebrow>{subscription.plan.name} plan</Eyebrow>
              <p className="mt-1 text-[13px] text-ink">
                {subscription.plan.annual_tests_count} tests / year · renews{' '}
                {formatDate(subscription.expires_at)}
              </p>
            </Card>
          ) : null}

          {/* Category summaries */}
          <section className="mt-8">
            <SectionHeader
              title="Categories"
              action={
                <Link href="/biomarkers" className="text-[13px] text-slate hover:underline">
                  See all
                </Link>
              }
            />
            {library.loading ? (
              <SkeletonCards count={4} height={120} />
            ) : categories.length === 0 ? (
              <Card className="p-6 text-sm text-inkSoft">No categories available yet.</Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((c) => {
                  const s = summaries[c.slug];
                  const total = s?.total ?? 0;
                  const optimal = s?.optimal ?? 0;
                  const review = s?.suboptimal ?? 0;
                  const pct = total > 0 ? optimal / total : 0;
                  return (
                    <Link key={c.id} href={`/biomarkers?category=${c.slug}`} className="block">
                      <InteractiveCard className="h-full p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="truncate font-display text-base text-ink">{c.name}</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-line">
                          <span
                            className="block h-full rounded-sm"
                            style={{
                              width: `${Math.round(pct * 100)}%`,
                              backgroundColor: statusColors.optimal,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-inkSoft">
                          {optimal} optimal · {review} review · {total} markers
                        </p>
                      </InteractiveCard>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
