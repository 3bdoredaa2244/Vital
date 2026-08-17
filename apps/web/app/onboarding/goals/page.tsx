'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OnboardingSteps } from '@/components/OnboardingSteps';
import { useToast } from '@/components/toast';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { contentApi, userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { messageFor, useApi } from '@/lib/use-api';
import { Target } from 'lucide-react';

const MAX_GOALS = 3;

export default function GoalsPage() {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Goals are admin-managed, so they come from the API rather than a constant.
  const goals = useApi(() => contentApi.goals(), []);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, slug];
    });
  };

  const onSubmit = async () => {
    if (selected.length === 0) {
      toast.error('Pick at least one goal.');
      return;
    }
    setSubmitting(true);
    try {
      const { user } = await userApi.updateGoals({ health_goals: selected });
      setUser(user);
      router.push('/onboarding/client-info');
    } catch (err) {
      toast.error(messageFor(err, 'Could not save your goals.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-7 sm:p-8">
      <OnboardingSteps current={1} />
      <h1 className="font-display text-3xl text-ink">What matters most?</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">
        Pick up to {MAX_GOALS}. We use these to prioritise your recommendations.
      </p>

      {goals.loading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={56} radius={4} />
          ))}
        </div>
      ) : goals.error ? (
        <EmptyState
          icon={<Target size={24} />}
          title="Goals unavailable"
          message="We couldn't load the goal list. You can skip this step and set your goals later from your profile."
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {(goals.data?.goals ?? [])
            .filter((g) => g.is_active)
            .map((goal) => {
              const active = selected.includes(goal.slug);
              const atLimit = !active && selected.length >= MAX_GOALS;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggle(goal.slug)}
                  disabled={atLimit}
                  aria-pressed={active}
                  className={`rounded-md border px-4 py-3.5 text-left text-sm transition disabled:opacity-40 ${
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-panel text-ink hover:border-accentSoft'
                  }`}
                >
                  {goal.label}
                </button>
              );
            })}
        </div>
      )}

      <div className="mt-7 flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push('/onboarding/client-info')}
          disabled={submitting}
        >
          Skip
        </Button>
        <Button className="flex-1" onClick={onSubmit} loading={submitting}>
          Continue
        </Button>
      </div>
    </Card>
  );
}
