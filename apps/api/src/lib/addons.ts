/**
 * Add-on (out-of-plan) markers: the purchasable catalog and order creation.
 * An add-on order groups the extra markers a customer attaches to a booking;
 * it is paid via Paymob at checkout and reconciled by the payment webhook.
 */
import type { AddonMarker } from '@vital/shared';
import { and, eq, gt, inArray, isNotNull } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  addonOrderItems,
  addonOrders,
  biomarkerCategories,
  biomarkers,
  bookings,
} from '../db/schema.js';
import { fail } from './http.js';

export const ADDON_VAT_RATE = 0.14; // Egyptian VAT, matching subscription checkout.

/** Active markers that carry a positive add-on price, with their category. */
export async function listAddonMarkers(): Promise<AddonMarker[]> {
  const rows = await db
    .select({
      id: biomarkers.id,
      name: biomarkers.name,
      unit: biomarkers.unit,
      categoryId: biomarkers.categoryId,
      categoryName: biomarkerCategories.name,
      price: biomarkers.addonPriceEgp,
    })
    .from(biomarkers)
    .innerJoin(biomarkerCategories, eq(biomarkers.categoryId, biomarkerCategories.id))
    .where(
      and(
        eq(biomarkers.isActive, true),
        isNotNull(biomarkers.addonPriceEgp),
        gt(biomarkers.addonPriceEgp, 0),
      ),
    )
    .orderBy(biomarkerCategories.displayOrder, biomarkers.displayOrder, biomarkers.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    category_id: r.categoryId,
    category_name: r.categoryName,
    price_egp: r.price as number,
  }));
}

/**
 * Create a pending add-on order for a user's booking. Validates the booking is
 * theirs and still active, and that every marker is purchasable; prices are
 * snapshotted onto the line items so later price edits don't change the order.
 */
export async function createAddonOrder(userId: string, bookingId: string, biomarkerIds: string[]) {
  const [booking] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .limit(1);
  if (!booking) fail('not_found', 'Booking not found.');
  if (booking.status !== 'booked') fail('unprocessable', 'This booking can no longer be modified.');

  const uniqueIds = [...new Set(biomarkerIds)];
  const markers = await db
    .select({ id: biomarkers.id, name: biomarkers.name, price: biomarkers.addonPriceEgp })
    .from(biomarkers)
    .where(
      and(
        eq(biomarkers.isActive, true),
        inArray(biomarkers.id, uniqueIds),
        isNotNull(biomarkers.addonPriceEgp),
        gt(biomarkers.addonPriceEgp, 0),
      ),
    );
  if (markers.length !== uniqueIds.length) {
    fail('unprocessable', 'One or more selected tests are unavailable.');
  }

  const subtotal = markers.reduce((sum, m) => sum + (m.price as number), 0);
  const vat = Math.round(subtotal * ADDON_VAT_RATE);
  const total = subtotal + vat;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(addonOrders)
      .values({
        userId,
        bookingId,
        status: 'pending',
        subtotalEgp: subtotal,
        vatEgp: vat,
        totalEgp: total,
      })
      .returning();
    await tx.insert(addonOrderItems).values(
      markers.map((m) => ({
        orderId: order!.id,
        biomarkerId: m.id,
        name: m.name,
        priceEgp: m.price as number,
      })),
    );
    const items = await tx
      .select()
      .from(addonOrderItems)
      .where(eq(addonOrderItems.orderId, order!.id));
    return { order: order!, items };
  });
}

/** Mark an add-on order paid (idempotent) — called from the payment webhook. */
export async function markAddonOrderPaid(orderId: string, paymentReference: string): Promise<void> {
  await db
    .update(addonOrders)
    .set({ status: 'paid', paymentReference })
    .where(and(eq(addonOrders.id, orderId), eq(addonOrders.status, 'pending')));
}
