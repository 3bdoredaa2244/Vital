/**
 * Test-booking logic (Phase 2): resolve availability from weekly windows + date
 * overrides, and create/cancel bookings with race-safe capacity enforcement.
 */
import type { CreateBookingInput, DayAvailability } from '@vital/shared';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  availabilityOverrides,
  availabilityWindows,
  bookingSlots,
  bookings,
  serviceAreas,
  users,
} from '../db/schema.js';
import { fail } from './http.js';

interface ResolvedWindow {
  startTime: string;
  endTime: string;
  capacity: number;
}

/** UTC day-of-week (0=Sunday) for a 'YYYY-MM-DD' date string. */
function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The base windows for an area on a date: override → else weekly template. */
async function baseWindows(
  areaId: string,
  date: string,
): Promise<{ closed: boolean; windows: ResolvedWindow[] }> {
  const [override] = await db
    .select()
    .from(availabilityOverrides)
    .where(and(eq(availabilityOverrides.areaId, areaId), eq(availabilityOverrides.date, date)))
    .limit(1);

  if (override?.isClosed) return { closed: true, windows: [] };
  if (override?.windows) {
    return { closed: false, windows: override.windows };
  }

  const weekly = await db
    .select()
    .from(availabilityWindows)
    .where(
      and(
        eq(availabilityWindows.areaId, areaId),
        eq(availabilityWindows.dayOfWeek, dayOfWeek(date)),
      ),
    );
  return {
    closed: false,
    windows: weekly.map((w) => ({ startTime: w.startTime, endTime: w.endTime, capacity: w.capacity })),
  };
}

/** Resolve a single day's bookable slots with live remaining capacity. */
export async function resolveDay(areaId: string, date: string): Promise<DayAvailability> {
  const { closed, windows } = await baseWindows(areaId, date);
  if (closed || windows.length === 0) {
    return { date, is_closed: closed, slots: [] };
  }

  const slots = await db
    .select()
    .from(bookingSlots)
    .where(and(eq(bookingSlots.areaId, areaId), eq(bookingSlots.date, date)));
  const bookedByStart = new Map(slots.map((s) => [s.startTime, s.bookedCount]));

  return {
    date,
    is_closed: false,
    slots: windows
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((w) => {
        const booked = bookedByStart.get(w.startTime) ?? 0;
        return {
          start_time: w.startTime,
          end_time: w.endTime,
          capacity: w.capacity,
          booked,
          remaining: Math.max(0, w.capacity - booked),
        };
      }),
  };
}

/** Resolve availability for `days` consecutive dates starting at `from`. */
export async function resolveRange(
  areaId: string,
  from: string,
  days: number,
): Promise<DayAvailability[]> {
  const out: DayAvailability[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    out.push(await resolveDay(areaId, d));
  }
  return out;
}

/**
 * Create a booking with atomic capacity enforcement. The capacity guard lives in
 * the UPDATE's WHERE clause, so concurrent bookings can never oversell a slot.
 */
export async function createBooking(userId: string, input: CreateBookingInput) {
  const today = new Date().toISOString().slice(0, 10);
  if (input.date < today) fail('unprocessable', 'That date is in the past.');

  const [area] = await db
    .select({ id: serviceAreas.id, name: serviceAreas.name, isActive: serviceAreas.isActive })
    .from(serviceAreas)
    .where(eq(serviceAreas.id, input.area_id))
    .limit(1);
  if (!area || !area.isActive) fail('not_found', 'Area not found or inactive.');

  const { closed, windows } = await baseWindows(input.area_id, input.date);
  if (closed) fail('unprocessable', 'This date is closed for booking.');
  const window = windows.find(
    (w) => w.startTime === input.start_time && w.endTime === input.end_time,
  );
  if (!window) fail('unprocessable', 'That slot is not available.');

  const [user] = await db
    .select({ address: users.address, latitude: users.latitude, longitude: users.longitude })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return db.transaction(async (tx) => {
    // Ensure the materialized slot row exists (capacity fixed at materialization).
    await tx
      .insert(bookingSlots)
      .values({
        areaId: input.area_id,
        date: input.date,
        startTime: window.startTime,
        endTime: window.endTime,
        capacity: window.capacity,
        bookedCount: 0,
      })
      .onConflictDoNothing({
        target: [bookingSlots.areaId, bookingSlots.date, bookingSlots.startTime],
      });

    // Atomic increment, guarded by capacity. No row → slot is full.
    const [slot] = await tx
      .update(bookingSlots)
      .set({ bookedCount: sql`${bookingSlots.bookedCount} + 1` })
      .where(
        and(
          eq(bookingSlots.areaId, input.area_id),
          eq(bookingSlots.date, input.date),
          eq(bookingSlots.startTime, window.startTime),
          sql`${bookingSlots.bookedCount} < ${bookingSlots.capacity}`,
        ),
      )
      .returning({ id: bookingSlots.id });
    if (!slot) fail('conflict', 'This slot is fully booked. Please choose another.');

    const [booking] = await tx
      .insert(bookings)
      .values({
        userId,
        slotId: slot.id,
        areaId: input.area_id,
        date: input.date,
        startTime: window.startTime,
        endTime: window.endTime,
        status: 'booked',
        address: user?.address ?? null,
        latitude: user?.latitude ?? null,
        longitude: user?.longitude ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    return { booking: booking!, areaName: area.name };
  });
}

/** Cancel a booking and free its slot. Returns the cancelled row, or null. */
export async function cancelBooking(userId: string, bookingId: string) {
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
      .limit(1);
    if (!booking || booking.status !== 'booked') return null;

    await tx.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, bookingId));
    await tx
      .update(bookingSlots)
      .set({ bookedCount: sql`greatest(${bookingSlots.bookedCount} - 1, 0)` })
      .where(eq(bookingSlots.id, booking.slotId));
    return booking;
  });
}

/**
 * Reschedule an existing booking to a new slot (and/or update its notes), with
 * the same race-safe capacity enforcement as creation. The new slot is claimed
 * before the old one is freed, so a failed claim leaves the original intact.
 * Returns the updated booking + area name, or null if it's missing/not editable.
 */
export async function rescheduleBooking(
  userId: string,
  bookingId: string,
  input: CreateBookingInput,
) {
  const today = new Date().toISOString().slice(0, 10);
  if (input.date < today) fail('unprocessable', 'That date is in the past.');

  const [area] = await db
    .select({ id: serviceAreas.id, name: serviceAreas.name, isActive: serviceAreas.isActive })
    .from(serviceAreas)
    .where(eq(serviceAreas.id, input.area_id))
    .limit(1);
  if (!area || !area.isActive) fail('not_found', 'Area not found or inactive.');

  const { closed, windows } = await baseWindows(input.area_id, input.date);
  if (closed) fail('unprocessable', 'This date is closed for booking.');
  const window = windows.find(
    (w) => w.startTime === input.start_time && w.endTime === input.end_time,
  );
  if (!window) fail('unprocessable', 'That slot is not available.');

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
      .limit(1);
    if (!current || current.status !== 'booked') return null;

    const sameSlot =
      current.areaId === input.area_id &&
      current.date === input.date &&
      current.startTime === window.startTime &&
      current.endTime === window.endTime;

    // Notes-only edit: no capacity movement needed.
    if (sameSlot) {
      const [updated] = await tx
        .update(bookings)
        .set({ notes: input.notes ?? null })
        .where(eq(bookings.id, bookingId))
        .returning();
      return { booking: updated!, areaName: area.name };
    }

    // Claim the target slot first (materialize, then guarded increment).
    await tx
      .insert(bookingSlots)
      .values({
        areaId: input.area_id,
        date: input.date,
        startTime: window.startTime,
        endTime: window.endTime,
        capacity: window.capacity,
        bookedCount: 0,
      })
      .onConflictDoNothing({
        target: [bookingSlots.areaId, bookingSlots.date, bookingSlots.startTime],
      });

    const [slot] = await tx
      .update(bookingSlots)
      .set({ bookedCount: sql`${bookingSlots.bookedCount} + 1` })
      .where(
        and(
          eq(bookingSlots.areaId, input.area_id),
          eq(bookingSlots.date, input.date),
          eq(bookingSlots.startTime, window.startTime),
          sql`${bookingSlots.bookedCount} < ${bookingSlots.capacity}`,
        ),
      )
      .returning({ id: bookingSlots.id });
    if (!slot) fail('conflict', 'This slot is fully booked. Please choose another.');

    // Release the old slot, then point the booking at the new one.
    await tx
      .update(bookingSlots)
      .set({ bookedCount: sql`greatest(${bookingSlots.bookedCount} - 1, 0)` })
      .where(eq(bookingSlots.id, current.slotId));

    const [updated] = await tx
      .update(bookings)
      .set({
        slotId: slot.id,
        areaId: input.area_id,
        date: input.date,
        startTime: window.startTime,
        endTime: window.endTime,
        notes: input.notes ?? null,
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return { booking: updated!, areaName: area.name };
  });
}
