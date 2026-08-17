'use client';

/**
 * Add-on markers — extra tests bought alongside an existing booking.
 * Selection totals are computed the same way the API does (14% Egyptian VAT
 * on the subtotal), and checkout hands off to Paymob's hosted iframe.
 */
import type { AddonMarker } from '@vital/shared';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import { Button, Card, EmptyState, Eyebrow, Input, PageHeader, SkeletonList } from '@/components/ui';
import { addonApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatEgp } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

const VAT_RATE = 0.14; // Egyptian VAT — mirrors apps/api/src/routes/payments.ts

export default function AddonsPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const toast = useToast();
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addons = useApi(() => addonApi.list(), [], enabled);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const all = addons.data?.addons ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? all.filter((a) => a.name.toLowerCase().includes(term)) : all;
  }, [all, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, AddonMarker[]>>((acc, a) => {
      (acc[a.category_name] ??= []).push(a);
      return acc;
    }, {});
  }, [filtered]);

  const subtotal = all
    .filter((a) => selected.includes(a.id))
    .reduce((sum, a) => sum + a.price_egp, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  const checkout = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const res = await addonApi.initiatePayment(bookingId, selected);
      setCheckoutUrl(res.iframe_url);
    } catch (err) {
      toast.error(messageFor(err, 'Could not start checkout for those markers.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Once Paymob returns an iframe URL we hand the whole surface over to it —
  // card details never touch VITAL.
  if (checkoutUrl) {
    return (
      <div>
        <button
          onClick={() => setCheckoutUrl(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-inkSoft transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to markers
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
          Payment is handled by Paymob. Your markers are added to the booking once payment
          completes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/bookings"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-inkSoft transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Bookings
      </Link>

      <PageHeader
        eyebrow="Testing"
        title="Add extra markers"
        subtitle="Markers outside your plan, drawn during the same visit. Paid separately."
      />

      <AsyncSection
        state={addons}
        feature="add-on markers"
        loading={<SkeletonList count={6} />}
        isEmpty={(d) => d.addons.length === 0}
        empty={
          <EmptyState
            icon={<TestTube2 size={26} />}
            title="No add-on markers available"
            message="Your VITAL team hasn't priced any markers as à-la-carte add-ons yet."
          />
        }
      >
        {() => (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markers…"
                aria-label="Search add-on markers"
                className="mb-4 max-w-sm"
              />

              {Object.keys(grouped).length === 0 ? (
                <Card className="p-6 text-sm text-inkSoft">No markers match that search.</Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, markers]) => (
                    <section key={category}>
                      <Eyebrow className="mb-2">{category}</Eyebrow>
                      <Card className="divide-y divide-line">
                        {markers.map((a) => {
                          const active = selected.includes(a.id);
                          return (
                            <label
                              key={a.id}
                              className="flex cursor-pointer items-center gap-3 px-5 py-3.5 transition hover:bg-panel/50"
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggle(a.id)}
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition ${
                                  active ? 'border-accent bg-accent' : 'border-line'
                                }`}
                              >
                                {active ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="3">
                                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm text-ink">{a.name}</span>
                                <span className="block text-xs text-inkMuted">{a.unit}</span>
                              </span>
                              <span className="shrink-0 font-display text-base text-ink">
                                {formatEgp(a.price_egp)}
                              </span>
                            </label>
                          );
                        })}
                      </Card>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-20 p-5">
                <Eyebrow>Order summary</Eyebrow>
                {selected.length === 0 ? (
                  <p className="mt-3 text-sm text-inkSoft">
                    Select markers to add them to this visit.
                  </p>
                ) : (
                  <>
                    <ul className="mt-3 space-y-1.5">
                      {all
                        .filter((a) => selected.includes(a.id))
                        .map((a) => (
                          <li key={a.id} className="flex justify-between gap-3 text-[13px]">
                            <span className="min-w-0 truncate text-inkSoft">{a.name}</span>
                            <span className="shrink-0 text-ink">{formatEgp(a.price_egp)}</span>
                          </li>
                        ))}
                    </ul>
                    <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-inkMuted">Subtotal</span>
                        <span className="text-ink">{formatEgp(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-inkMuted">VAT (14%)</span>
                        <span className="text-ink">{formatEgp(vat)}</span>
                      </div>
                      <div className="flex justify-between border-t border-line pt-2">
                        <span className="text-ink">Total</span>
                        <span className="font-display text-lg text-ink">{formatEgp(total)}</span>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  className="mt-5 w-full"
                  disabled={selected.length === 0}
                  loading={submitting}
                  onClick={() => void checkout()}
                >
                  Continue to payment
                </Button>
                <p className="mt-2 text-center text-[11px] text-inkMuted">
                  Final total is confirmed by the API at checkout.
                </p>
              </Card>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
