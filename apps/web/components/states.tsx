'use client';

/**
 * Shared page-level state renderers: the subscription gate and a standard
 * wrapper that maps an `useApi` result onto loading / error / locked / empty.
 */
import { Lock, WifiOff } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { AsyncState } from '@/lib/use-api';
import { Button, EmptyState, ErrorState } from './ui';

/**
 * Shown when the API returns 403 because the user has no active subscription.
 * Most VITAL data routes (`/score`, `/biomarkers`, `/results`, `/ai`,
 * `/bookings`, `/recommendations`, `/notifications`) sit behind this gate, so
 * it is a first-class state rather than an error.
 */
export function SubscriptionGate({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={<Lock size={26} />}
      title="Start your health journey"
      message={`A VITAL subscription unlocks ${feature}. Choose a plan to begin tracking the markers that matter.`}
      action={
        <Link href="/subscriptions">
          <Button>View plans</Button>
        </Link>
      }
    />
  );
}

/**
 * Renders the right thing for an async resource. Keeps every page from
 * re-implementing the same four branches.
 */
export function AsyncSection<T>({
  state,
  feature,
  loading,
  isEmpty,
  empty,
  children,
}: {
  state: AsyncState<T>;
  /** Human phrase for the subscription gate, e.g. "your VITAL Score". */
  feature: string;
  /** What to show while loading (a skeleton matching the real layout). */
  loading: ReactNode;
  /** Predicate for "the request succeeded but there's nothing to show". */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) return <>{loading}</>;

  if (state.error) {
    if (state.error.kind === 'forbidden') return <SubscriptionGate feature={feature} />;
    if (state.error.kind === 'network') {
      return (
        <EmptyState
          icon={<WifiOff size={26} />}
          title="Can't reach VITAL"
          message="The server didn't respond. Check that the API is running and your connection is live."
          action={<Button variant="secondary" onClick={state.reload}>Try again</Button>}
        />
      );
    }
    return <ErrorState message={state.error.message} onRetry={state.reload} />;
  }

  if (!state.data) return <>{loading}</>;
  if (isEmpty?.(state.data) && empty) return <>{empty}</>;

  return <>{children(state.data)}</>;
}
