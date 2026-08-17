'use client';

/**
 * Bookings — the user's home blood-draw appointments, with cancel, reschedule
 * (via the new-booking flow) and the add-on marker upsell for upcoming visits.
 */
import type { Booking } from '@vital/shared';
import { CalendarCheck, MapPin, Plus, TestTube2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, Modal, PageHeader, SkeletonList } from '@/components/ui';
import { bookingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatTimeRange, todayIso } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

const STATUS_COLOR: Record<Booking['status'], string> = {
  booked: '#6FA97D',
  completed: '#6E8BA0',
  cancelled: '#A79E8D',
};

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const upcoming = booking.status === 'booked' && booking.date >= todayIso();

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-xl text-ink">{formatDate(booking.date)}</div>
          <div className="mt-0.5 text-sm text-inkSoft">
            {formatTimeRange(booking.start_time, booking.end_time)}
          </div>
        </div>
        <Badge color={STATUS_COLOR[booking.status]}>{booking.status}</Badge>
      </div>

      <div className="mt-3 flex items-start gap-2 text-[13px] text-inkSoft">
        <MapPin size={15} className="mt-0.5 shrink-0 text-inkMuted" />
        <span>
          {booking.area_name}
          {booking.address ? ` — ${booking.address}` : ''}
        </span>
      </div>

      {booking.notes ? (
        <p className="mt-2 text-[13px] text-inkSoft">
          <span className="text-inkMuted">Notes: </span>
          {booking.notes}
        </p>
      ) : null}

      {upcoming ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Link href={`/bookings/${booking.id}/addons`}>
            <Button variant="secondary" icon={<TestTube2 size={15} />}>
              Add extra markers
            </Button>
          </Link>
          <Link href={`/bookings/new?reschedule=${booking.id}`}>
            <Button variant="secondary">Reschedule</Button>
          </Link>
          <Button variant="danger" onClick={onCancel} loading={cancelling}>
            Cancel
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export default function BookingsPage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;
  const toast = useToast();
  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const bookings = useApi(() => bookingApi.mine(), [], enabled);

  const doCancel = async () => {
    if (!confirming) return;
    setCancellingId(confirming.id);
    try {
      await bookingApi.cancel(confirming.id);
      toast.success('Booking cancelled.');
      setConfirming(null);
      bookings.reload();
    } catch (err) {
      toast.error(messageFor(err, 'Could not cancel that booking.'));
    } finally {
      setCancellingId(null);
    }
  };

  const all = bookings.data?.bookings ?? [];
  const today = todayIso();
  const upcoming = all.filter((b) => b.status === 'booked' && b.date >= today);
  const past = all.filter((b) => !(b.status === 'booked' && b.date >= today));

  return (
    <div>
      <PageHeader
        eyebrow="Testing"
        title="Bookings"
        subtitle="A VITAL clinician draws your blood at home or at your office."
        action={
          <Link href="/bookings/new">
            <Button icon={<Plus size={15} />}>Book a test</Button>
          </Link>
        }
      />

      <AsyncSection
        state={bookings}
        feature="home blood-draw booking"
        loading={<SkeletonList count={3} />}
        isEmpty={(d) => d.bookings.length === 0}
        empty={
          <EmptyState
            icon={<CalendarCheck size={26} />}
            title="No bookings yet"
            message="Pick an area and a time slot, and a VITAL clinician will come to you."
            action={
              <Link href="/bookings/new">
                <Button>Book your first test</Button>
              </Link>
            }
          />
        }
      >
        {() => (
          <div className="space-y-8">
            {upcoming.length > 0 ? (
              <section>
                <div className="vital-eyebrow mb-3 text-accent">Upcoming</div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {upcoming.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      cancelling={cancellingId === b.id}
                      onCancel={() => setConfirming(b)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {past.length > 0 ? (
              <section>
                <div className="vital-eyebrow mb-3 text-inkMuted">Past</div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} cancelling={false} onCancel={() => undefined} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </AsyncSection>

      <Modal open={!!confirming} onClose={() => setConfirming(null)} title="Cancel this booking?">
        <p className="text-sm leading-relaxed text-inkSoft">
          Your visit on {confirming ? formatDate(confirming.date) : ''} at{' '}
          {confirming?.start_time} will be cancelled and the slot released. You can book again at
          any time.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirming(null)}>
            Keep booking
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={!!cancellingId}
            onClick={() => void doCancel()}
          >
            Cancel booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}
