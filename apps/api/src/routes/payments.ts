/**
 * Paymob payment routes.
 *
 *   POST /payments/initiate  (auth)   → creates a Paymob order, returns the
 *                                        payment key + iframe URL for the WebView
 *   POST /payments/webhook   (public) → Paymob transaction callback, HMAC-verified,
 *                                        activates the subscription on success
 */
import { initiateAddonPaymentSchema, initiatePaymentSchema } from '@vital/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { addonOrders, subscriptionPlans, subscriptions } from '../db/schema.js';
import { createAddonOrder, markAddonOrderPaid } from '../lib/addons.js';
import { errorResponse } from '../lib/http.js';
import { initiatePayment, verifyWebhookHmac } from '../lib/paymob.js';
import { serializeAddonOrder } from '../lib/serialize.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const paymentRoutes = new Hono<{ Variables: AuthVariables }>();

const VAT_RATE = 0.14; // Egyptian VAT

paymentRoutes.post(
  '/initiate',
  requireAuth,
  validate('json', initiatePaymentSchema),
  async (c) => {
    const user = c.get('user');
    const { plan_id } = c.req.valid('json');

    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, plan_id))
      .limit(1);

    if (!plan || !plan.isActive) {
      return errorResponse(c, 'not_found', 'Subscription plan not found');
    }

    // Total charged = plan price + 14% VAT.
    const totalEgp = Math.round(plan.priceEgp * (1 + VAT_RATE));

    // Create a pending subscription row up front; we reconcile it on webhook.
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const [pending] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        planId: plan.id,
        status: 'expired', // becomes 'active' only after a verified success webhook
        expiresAt,
      })
      .returning();

    if (!pending) return errorResponse(c, 'server_error', 'Could not create order');

    const [firstName, ...rest] = user.fullName.split(' ');
    const result = await initiatePayment({
      amountEgp: totalEgp,
      merchantOrderId: pending.id,
      billing: {
        email: user.email,
        first_name: firstName || user.fullName,
        last_name: rest.join(' ') || 'NA',
        phone_number: user.phone ?? 'NA',
      },
    });

    // Stash the Paymob order id so the webhook can reconcile by merchant_order_id.
    await db
      .update(subscriptions)
      .set({ paymentReference: result.order_id })
      .where(eq(subscriptions.id, pending.id));

    return c.json({
      payment_key: result.payment_key,
      iframe_url: result.iframe_url,
      order_id: result.order_id,
      subscription_id: pending.id,
      amount_egp: totalEgp,
    });
  },
);

paymentRoutes.post(
  '/addons/initiate',
  requireAuth,
  validate('json', initiateAddonPaymentSchema),
  async (c) => {
    const user = c.get('user');
    const { booking_id, biomarker_ids } = c.req.valid('json');

    const { order, items } = await createAddonOrder(user.id, booking_id, biomarker_ids);

    const [firstName, ...rest] = user.fullName.split(' ');
    const result = await initiatePayment({
      amountEgp: order.totalEgp,
      // "addon:" prefix lets the webhook reconcile against addon_orders, not subscriptions.
      merchantOrderId: `addon:${order.id}`,
      billing: {
        email: user.email,
        first_name: firstName || user.fullName,
        last_name: rest.join(' ') || 'NA',
        phone_number: user.phone ?? 'NA',
      },
    });

    await db
      .update(addonOrders)
      .set({ paymentReference: result.order_id })
      .where(eq(addonOrders.id, order.id));

    return c.json({
      payment_key: result.payment_key,
      iframe_url: result.iframe_url,
      order_id: result.order_id,
      order: serializeAddonOrder(order, items),
      amount_egp: order.totalEgp,
    });
  },
);

paymentRoutes.post('/webhook', async (c) => {
  const hmac = c.req.query('hmac');
  if (!hmac) return errorResponse(c, 'forbidden', 'Missing HMAC');

  const body = (await c.req.json().catch(() => null)) as { obj?: Record<string, unknown> } | null;
  const obj = body?.obj;
  if (!obj) return errorResponse(c, 'validation_error', 'Malformed webhook payload');

  if (!verifyWebhookHmac(obj, hmac)) {
    return errorResponse(c, 'forbidden', 'HMAC verification failed');
  }

  const success = obj.success === true;
  const order = obj.order as { merchant_order_id?: string; id?: number } | undefined;
  const merchantOrderId = order?.merchant_order_id;

  if (!merchantOrderId) {
    // Acknowledge to stop Paymob retries, but nothing to reconcile.
    return c.json({ received: true });
  }

  const reference = String(obj.id ?? order?.id ?? merchantOrderId);

  // Add-on orders are tagged "addon:<orderId>"; everything else is a subscription.
  if (merchantOrderId.startsWith('addon:')) {
    if (success) await markAddonOrderPaid(merchantOrderId.slice('addon:'.length), reference);
    return c.json({ received: true });
  }

  if (success) {
    await db
      .update(subscriptions)
      .set({ status: 'active', startedAt: new Date(), paymentReference: reference })
      .where(eq(subscriptions.id, merchantOrderId));
  }

  return c.json({ received: true });
});
