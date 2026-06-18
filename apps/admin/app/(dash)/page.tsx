'use client';

import type { AdminOverview } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { Card, EyebrowLabel, KPICard, PageHd, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

// Plan bar colours (data viz, not interactive chrome).
const PLAN_COLOR: Record<string, string> = { basic: '#6E8BA0', premium: '#3E7A53' };

export default function OverviewPage() {
  const { push } = useToast();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .overview()
      .then((r) => setData(r.overview))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  if (loading) return <Spinner />;
  if (!data) return <div className="text-inkSoft">No data.</div>;

  const totalActive = data.plan_breakdown.reduce((s, p) => s + p.count, 0);

  return (
    <div>
      <PageHd title="Dashboard" sub="Platform health at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total users" value={data.users_total.toLocaleString()} hint={`${data.admins_total} admins`} />
        <KPICard label="Active subscriptions" value={data.active_subscriptions.toLocaleString()} hint="paying customers" />
        <KPICard label="Revenue (active)" value={`${data.revenue_egp.toLocaleString()} EGP`} hint="annual, from active plans" />
        <KPICard label="Results logged" value={data.results_total.toLocaleString()} hint="across all users" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Lab uploads" value={data.lab_uploads_total.toLocaleString()} hint="total uploaded" />
        <KPICard
          label="Pending review"
          value={data.pending_uploads.toLocaleString()}
          hint="uploads awaiting confirmation"
          tone={data.pending_uploads > 0 ? 'alert' : 'ink'}
        />
      </div>

      {/* Active plans breakdown */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Active plans</h2>
        <Card className="p-5">
          {data.plan_breakdown.length === 0 ? (
            <div className="text-sm text-inkMuted">No active subscriptions yet.</div>
          ) : (
            <div className="space-y-4">
              {data.plan_breakdown.map((p) => {
                const pct = totalActive > 0 ? Math.round((p.count / totalActive) * 100) : 0;
                return (
                  <div key={p.plan} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium capitalize text-ink">{p.plan}</span>
                        <span className="font-display text-lg font-extrabold text-ink">{p.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: PLAN_COLOR[p.plan] ?? '#6E8BA0' }}
                        />
                      </div>
                    </div>
                    <span className="w-9 text-right text-xs text-inkMuted">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <EyebrowLabel className="mt-8">Note</EyebrowLabel>
      <p className="max-w-2xl text-xs text-inkMuted">
        Trend deltas and signup charts require historical snapshots, which aren&apos;t collected yet —
        the figures above are live point-in-time counts.
      </p>
    </div>
  );
}
