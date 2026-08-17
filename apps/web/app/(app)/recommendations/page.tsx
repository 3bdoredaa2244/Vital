'use client';

/**
 * Recommendations — the interventions the API surfaces for this user, grouped
 * by category, each showing the markers that triggered it.
 */
import type { InterventionCategory, RecommendedIntervention } from '@vital/shared';
import { ClipboardList, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { AsyncSection } from '@/components/states';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonList } from '@/components/ui';
import { recommendationApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { statusColors } from '@/lib/theme';
import { useApi } from '@/lib/use-api';

const CATEGORY_LABELS: Record<InterventionCategory, string> = {
  supplement: 'Supplements',
  nutrition: 'Nutrition',
  lifestyle: 'Lifestyle',
  retest: 'Retest',
};

const EVIDENCE_COLOR: Record<string, string> = {
  strong: '#6FA97D',
  moderate: '#CDA24E',
  limited: '#A79E8D',
};

function RecommendationCard({ rec }: { rec: RecommendedIntervention }) {
  const iv = rec.intervention;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-ink">{iv.name}</h3>
          {iv.dosage ? <p className="mt-0.5 text-[13px] text-accent">{iv.dosage}</p> : null}
        </div>
        <Badge color={EVIDENCE_COLOR[iv.evidence_level]}>{iv.evidence_level} evidence</Badge>
      </div>

      {iv.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-inkSoft">{iv.summary}</p>
      ) : null}

      {iv.detail ? (
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-inkSoft">
          {iv.detail}
        </p>
      ) : null}

      {rec.matched.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <div className="vital-eyebrow mb-2 text-inkMuted">Triggered by</div>
          <div className="flex flex-wrap gap-2">
            {rec.matched.map((m) => (
              <span
                key={m.slug}
                className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs"
                style={{
                  borderColor: statusColors[m.status],
                  color: statusColors[m.status],
                  backgroundColor: `${statusColors[m.status]}12`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusColors[m.status] }}
                />
                {m.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {iv.url ? (
        <a
          href={iv.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"
        >
          Read the evidence <ExternalLink size={13} />
        </a>
      ) : null}
    </Card>
  );
}

export default function RecommendationsPage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;
  const recs = useApi(() => recommendationApi.me(), [], enabled);

  return (
    <div>
      <PageHeader
        eyebrow="Guidance"
        title="Recommendations"
        subtitle="Supplement, nutrition and lifestyle protocols matched to the markers that are out of range."
      />

      <AsyncSection
        state={recs}
        feature="personalised recommendations"
        loading={<SkeletonList count={4} />}
        isEmpty={(d) => d.recommendations.length === 0}
        empty={
          <EmptyState
            icon={<ClipboardList size={26} />}
            title="Nothing to recommend yet"
            message="Recommendations appear once you have results that fall outside the optimal range. That's a good place to be."
            action={
              <Link href="/biomarkers">
                <Button variant="secondary">Browse markers</Button>
              </Link>
            }
          />
        }
      >
        {(data) => {
          const grouped = data.recommendations.reduce<
            Record<string, RecommendedIntervention[]>
          >((acc, r) => {
            const key = r.intervention.category;
            (acc[key] ??= []).push(r);
            return acc;
          }, {});

          return (
            <>
              <div className="mb-6 rounded-md border border-line bg-panel px-4 py-3 text-xs leading-relaxed text-inkSoft">
                These are wellness suggestions generated from your lab data — not medical advice.
                Talk to a licensed clinician before starting any supplement or changing medication.
              </div>

              <div className="space-y-8">
                {(Object.keys(grouped) as InterventionCategory[]).map((cat) => (
                  <section key={cat}>
                    <div className="vital-eyebrow mb-3 text-accent">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {grouped[cat]!.map((r) => (
                        <RecommendationCard key={r.intervention.id} rec={r} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          );
        }}
      </AsyncSection>
    </div>
  );
}
