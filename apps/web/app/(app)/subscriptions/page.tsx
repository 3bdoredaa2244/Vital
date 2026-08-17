'use client';

/**
 * Subscription — the current plan (if any) and the available plans, with
 * Paymob checkout for upgrades. This is the one page that stays useful without
 * an active subscription, so it is deliberately not gated.
 */
import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '@/components/toast';
import {
  Badge,
  Button,
  Card,
  DataRow,
  EmptyState,
  Eyebrow,
  PageHeader,
  SkeletonCards,
} from '@/components/ui';
import { subscriptionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatEgp } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

export default function SubscriptionsPage() {
  const { subscription, hasActiveSubscription, refreshSubscription } = useAuth();
  const toast = useToast();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  // Plans are public — they load whether or not the user has a subscription.
  const plans = useApi(() => subscriptionApi.plans(), []);

  const startCheckout = async (planId: string) => {
    setPendingPlan(planId);
    try {
      const res = await subscriptionApi.initiatePayment(planId);
      setCheckoutUrl(res.iframe_url);
    } catch (err) {
      toast.error(messageFor(err, 'Could not start checkout for that plan.'));
    } finally {
      setPendingPlan(null);
    }
  };

  if (checkoutUrl) {
    return (
      <div>
        <button
          onClick={() => {
            setCheckoutUrl(null);
            // The webhook activates the subscription server-side; re-read it so
            // the app reflects a completed payment without a manual reload.
            void refreshSubscription();
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-inkSoft transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to plans
        </button>
        <PageHeader eyebrow="Checkout" title="Complete your payment" />
        <Card className="overflow-hidden">
          <iframe
            src={checkoutUrl}
            title="Paymob secure checkout"
            className="h-[720px] w-full border-0"
          />
        </Card>
        <p className="mt-3 text-xs text-inkMuted">
          Payment is handled by Paymob — your card details never reach VITAL. Your plan activates
          as soon as the payment is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Subscription"
        subtitle="Your plan determines how many panels you get each year and how many markers each one covers."
      />

      {/* Current plan */}
      {subscription ? (
        <Card className="mb-8 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Eyebrow>Current plan</Eyebrow>
              <h2 className="mt-1 font-display text-2xl capitalize text-ink">
                {subscription.plan.name}
              </h2>
            </div>
            <Badge color={hasActiveSubscription ? '#6FA97D' : '#C2603C'}>
              {hasActiveSubscription ? 'Active' : subscription.status}
            </Badge>
          </div>
          <div className="mt-4 border-t border-line pt-2">
            <DataRow label="Started" value={formatDate(subscription.started_at)} />
            <DataRow label="Renews" value={formatDate(subscription.expires_at)} />
            <DataRow label="Tests per year" value={subscription.plan.annual_tests_count} />
            <DataRow label="Markers covered" value={subscription.plan.biomarker_count} />
          </div>
        </Card>
      ) : null}

      {/* Available plans */}
      <Eyebrow className="mb-3">{subscription ? 'Change plan' : 'Choose a plan'}</Eyebrow>

      {plans.loading ? (
        <SkeletonCards count={2} height={280} />
      ) : plans.error ? (
        <Card className="p-6 text-sm text-inkSoft">
          Could not load the plan list. {plans.error.message}
        </Card>
      ) : (plans.data?.plans.filter((p) => p.is_active).length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard size={26} />}
            title="No plans available"
            message="There are no active subscription plans right now. Contact support if you were expecting one."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans
            .data!.plans.filter((p) => p.is_active)
            .map((plan) => {
              const isCurrent = subscription?.plan_id === plan.id && hasActiveSubscription;
              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col p-6 ${isCurrent ? 'border-accent' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl capitalize text-ink">{plan.name}</h3>
                    {isCurrent ? <Badge color="#6FA97D">Current</Badge> : null}
                  </div>

                  <div className="mt-3">
                    <span className="font-display text-4xl text-ink">
                      {plan.price_display || formatEgp(plan.price_egp)}
                    </span>
                    <span className="ml-1 text-sm text-inkSoft">/ year</span>
                  </div>

                  <p className="mt-2 text-[13px] text-inkSoft">
                    {plan.annual_tests_count} test{plan.annual_tests_count === 1 ? '' : 's'} a year ·{' '}
                    {plan.biomarker_count} markers
                  </p>

                  {plan.features.length > 0 ? (
                    <ul className="mt-5 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-inkSoft">
                          <Check size={15} className="mt-0.5 shrink-0 text-green" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <Button
                    className="mt-6 w-full"
                    variant={isCurrent ? 'secondary' : 'primary'}
                    disabled={isCurrent}
                    loading={pendingPlan === plan.id}
                    onClick={() => void startCheckout(plan.id)}
                  >
                    {isCurrent ? 'Your current plan' : `Choose ${plan.name}`}
                  </Button>
                </Card>
              );
            })}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-inkMuted">
        Payments are processed by Paymob. VITAL never stores your card details.
      </p>
    </div>
  );
}
