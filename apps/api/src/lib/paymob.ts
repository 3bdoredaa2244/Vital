/**
 * Paymob (Egyptian payment gateway) integration.
 *
 * Classic Paymob flow:
 *   1. POST /auth/tokens         → auth_token
 *   2. POST /ecommerce/orders    → order id
 *   3. POST /acceptance/payment_keys → payment_key (used in the iframe)
 *
 * The mobile client opens `${iframe_url}?payment_token=<payment_key>` in a
 * WebView. After payment, Paymob calls our webhook which we verify via HMAC.
 */
import crypto from 'node:crypto';

import { env } from './env.js';
import { fail } from './http.js';

interface PaymobBillingData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface InitiateArgs {
  amountEgp: number; // whole EGP; converted to piasters internally
  merchantOrderId: string; // our subscription/order reference
  billing: PaymobBillingData;
}

export interface PaymobInitiateResult {
  payment_key: string;
  iframe_url: string;
  order_id: string;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.PAYMOB_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    fail('payment_error', `Paymob request to ${path} failed (${res.status})`, text);
  }
  return (await res.json()) as T;
}

async function authenticate(): Promise<string> {
  const data = await postJson<{ token: string }>('/auth/tokens', {
    api_key: env.PAYMOB_API_KEY,
  });
  return data.token;
}

export async function initiatePayment(args: InitiateArgs): Promise<PaymobInitiateResult> {
  const amountCents = Math.round(args.amountEgp * 100);
  const authToken = await authenticate();

  const order = await postJson<{ id: number }>('/ecommerce/orders', {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    merchant_order_id: args.merchantOrderId,
    items: [],
  });

  const paymentKey = await postJson<{ token: string }>('/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: order.id,
    currency: 'EGP',
    integration_id: Number(env.PAYMOB_INTEGRATION_ID),
    billing_data: {
      ...args.billing,
      apartment: 'NA',
      floor: 'NA',
      street: 'NA',
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'NA',
      country: 'EG',
      state: 'NA',
    },
  });

  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

  return {
    payment_key: paymentKey.token,
    iframe_url: iframeUrl,
    order_id: String(order.id),
  };
}

/**
 * Verify a Paymob transaction-processed callback HMAC.
 *
 * Paymob concatenates a fixed, lexicographically-ordered subset of the
 * `obj` fields, HMAC-SHA512s them with the merchant HMAC secret, and sends
 * the result as the `hmac` query param. We recompute and compare.
 */
const HMAC_FIELD_ORDER = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function verifyWebhookHmac(
  obj: Record<string, unknown>,
  receivedHmac: string,
): boolean {
  const concatenated = HMAC_FIELD_ORDER.map((field) => {
    const value = getNested(obj, field);
    return value === undefined || value === null ? '' : String(value);
  }).join('');

  const computed = crypto
    .createHmac('sha512', env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(receivedHmac, 'hex'),
    );
  } catch {
    return false;
  }
}
