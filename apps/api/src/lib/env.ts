/**
 * Zod-validated environment configuration. Fails fast at boot if anything
 * required is missing so we never run with a half-configured backend.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  // Anon key is optional on the server but handy for JWT verification fallback.
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  // Storage bucket for admin-uploaded lab PDFs.
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('lab-results'),

  PAYMOB_API_KEY: z.string().min(1),
  PAYMOB_INTEGRATION_ID: z.string().min(1),
  PAYMOB_IFRAME_ID: z.string().min(1),
  PAYMOB_HMAC_SECRET: z.string().min(1),
  PAYMOB_BASE_URL: z.string().url().default('https://accept.paymob.com/api'),

  // Where Paymob should redirect the WebView after payment.
  PAYMENT_RETURN_URL: z.string().url().default('https://vital.app/payment/return'),

  // AI Health Intelligence (optional — features degrade gracefully if absent).
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
