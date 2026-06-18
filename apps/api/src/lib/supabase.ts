/**
 * Server-side Supabase admin client (uses the service-role key — never expose
 * this to the client). Used for auth operations and verifying JWTs.
 */
import { createClient } from '@supabase/supabase-js';

import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
