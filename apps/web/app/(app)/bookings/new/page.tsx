'use client';

/**
 * Book (or reschedule) a home blood draw: choose a service area, then a day,
 * then a slot with live remaining capacity from
 * GET /areas/:id/availability?from=&days=.
 *
 * Passing ?reschedule=<bookingId> switches the submit to PUT /bookings/:id,
 * which is exactly how the API models a move.
 */
import type { DayAvailability, ServiceArea } from '@vital/shared';
import { ArrowLeft, CalendarX, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Field,
  LoadingState,
  PageHeader,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { bookingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDayLabel, todayIso } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

const WINDOW_DAYS = 14;

function NewBookingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { user, hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;

  const rescheduleId = params.get('reschedule');

  const [areaId, setAreaId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const areas = useApi(() => bookingApi.areas(), [], enabled);

  // Default to the first active area once they load.
  useEffect(() => {
    if (!areaId && areas.data?.areas.length) {
      const first = areas.data.areas.find((a: ServiceArea) => a.is_active) ?? areas.data.areas[0];
      if (first) setAreaId(first.id);
    }
  }, [areas.data, areaId]);

  const availability = useApi(
    () => bookingApi.availability(areaId!, todayIso(), WINDOW_DAYS),
    [areaId],
    !!areaId && enabled,
  );

  // Reset the chosen day/slot whenever the area changes.
  useEffect(() => {
    setDay(null);
    setSlot(null);
  }, [areaId]);

  const days: DayAvailability[] = availability.data?.availability ?? [];
  const selectedDay = days.find((d) => d.date === day) ?? null;

  const submit = async () => {
    if (!areaId || !day || !slot) return;
    setSubmitting(true);
    const payload = {
      area_id: areaId,
      date: day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      notes: notes.trim() || undefined,
    };
    try {
      if (rescheduleId) {
        await bookingApi.reschedule(rescheduleId, payload);
        toast.success('Your booking has been moved.');
      } else {
        await bookingApi.book(payload);
        toast.success('Your test is booked.');
      }
      router.replace('/bookings');
    } catch (err) {
      toast.error(messageFor(err, 'Could not confirm that booking.'));
    } finally {
      setSubmitting(false);
    }
  };

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
        title={rescheduleId ? 'Reschedule your test' : 'Book a test'}
        subtitle="A VITAL clinician comes to you. Pick an area, a day, and a window that suits you."
      />

      <AsyncSection
        state={areas}
        feature="home blood-draw booking"
        loading={<Skeleton height={200} />}
        isEmpty={(d) => d.areas.filter((a) => a.is_active).length === 0}
        empty={
          <EmptyState
            icon={<CalendarX size={26} />}
            title="No service areas yet"
            message="VITAL isn't covering any areas for home draws right now. Check back soon, or contact support to ask about your area."
          />
        }
      >
        {(data) => (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {/* Step 1 — area */}
              <Card className="p-5">
                <Eyebrow>1 — Service area</Eyebrow>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.areas
                    .filter((a) => a.is_active)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAreaId(a.id)}
                        aria-pressed={areaId === a.id}
                        className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                          areaId === a.id
                            ? 'border-accent bg-accent/10'
                            : 'border-line bg-panel hover:border-accentSoft'
                        }`}
                      >
                        <span>
                          <span className="block text-sm text-ink">{a.name}</span>
                          <span className="block text-xs text-inkMuted">{a.city}</span>
                        </span>
                        {areaId === a.id ? <Check size={16} className="text-accent" /> : null}
                      </button>
                    ))}
                </div>
              </Card>

              {/* Step 2 — day */}
              <Card className="p-5">
                <Eyebrow>2 — Day</Eyebrow>
                {!areaId ? (
                  <p className="mt-3 text-sm text-inkSoft">Choose a service area first.</p>
                ) : availability.loading ? (
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} width={92} height={70} />
                    ))}
                  </div>
                ) : availability.error ? (
                  <p className="mt-3 text-sm text-rust">{availability.error.message}</p>
                ) : days.length === 0 ? (
                  <p className="mt-3 text-sm text-inkSoft">
                    No availability published for the next {WINDOW_DAYS} days.
                  </p>
                ) : (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {days.map((d) => {
                      const open = !d.is_closed && d.slots.some((s) => s.remaining > 0);
                      const active = day === d.date;
                      return (
                        <button
                          key={d.date}
                          type="button"
                          disabled={!open}
                          onClick={() => {
                            setDay(d.date);
                            setSlot(null);
                          }}
                          aria-pressed={active}
                          className={`w-[92px] shrink-0 rounded-md border px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            active
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-line bg-panel text-ink hover:border-accentSoft'
                          }`}
                        >
                          <span className="block text-[13px]">{formatDayLabel(d.date)}</span>
                          <span className="mt-1 block font-mono text-[10px] uppercase tracking-eyebrow text-inkMuted">
                            {open ? `${d.slots.filter((s) => s.remaining > 0).length} slots` : 'Closed'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Step 3 — slot */}
              <Card className="p-5">
                <Eyebrow>3 — Time window</Eyebrow>
                {!selectedDay ? (
                  <p className="mt-3 text-sm text-inkSoft">Choose a day to see its windows.</p>
                ) : selectedDay.slots.filter((s) => s.remaining > 0).length === 0 ? (
                  <p className="mt-3 text-sm text-inkSoft">No windows left on this day.</p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {selectedDay.slots.map((s) => {
                      const active = slot?.start_time === s.start_time;
                      return (
                        <button
                          key={s.start_time}
                          type="button"
                          disabled={s.remaining <= 0}
                          onClick={() => setSlot({ start_time: s.start_time, end_time: s.end_time })}
                          aria-pressed={active}
                          className={`rounded-md border px-3 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            active
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-line bg-panel text-ink hover:border-accentSoft'
                          }`}
                        >
                          <span className="block text-sm">
                            {s.start_time}–{s.end_time}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-eyebrow text-inkMuted">
                            {s.remaining} left
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Summary / confirm */}
            <div>
              <Card className="sticky top-20 p-5">
                <Eyebrow>Summary</Eyebrow>

                <dl className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-inkMuted">Area</dt>
                    <dd className="text-right text-ink">
                      {data.areas.find((a) => a.id === areaId)?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-inkMuted">Day</dt>
                    <dd className="text-right text-ink">{day ? formatDayLabel(day) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-inkMuted">Window</dt>
                    <dd className="text-right text-ink">
                      {slot ? `${slot.start_time}–${slot.end_time}` : '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-line pt-4">
                  <Field
                    label="Notes for the clinician"
                    hint="Gate codes, floor, parking, or anything else that helps."
                    htmlFor="notes"
                  >
                    <Textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Building 4, 3rd floor, ring the top bell."
                    />
                  </Field>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-inkMuted">
                  We&apos;ll come to{' '}
                  {user?.address ? (
                    <span className="text-inkSoft">{user.address}</span>
                  ) : (
                    <>
                      the address on your profile.{' '}
                      <Link href="/profile" className="text-accent hover:underline">
                        Add one
                      </Link>
                    </>
                  )}
                  .
                </p>

                <Button
                  className="w-full"
                  disabled={!areaId || !day || !slot}
                  loading={submitting}
                  onClick={() => void submit()}
                >
                  {rescheduleId ? 'Move booking' : 'Confirm booking'}
                </Button>
              </Card>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewBookingInner />
    </Suspense>
  );
}
