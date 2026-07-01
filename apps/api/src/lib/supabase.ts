/**
 * Server-side Supabase admin client (uses the service-role key — never expose
 * this to the client). Used for auth operations and verifying JWTs.
 */
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import WebSocket from 'ws';

import { env } from './env.js';

// @supabase/realtime-js resolves a WebSocket transport when the client is
// constructed. Node.js < 22 has no global WebSocket, so without an explicit
// transport `createClient` throws at import time. We only use Auth + Storage
// here (never Realtime), but the constructor still needs a valid transport —
// supply the `ws` implementation. No socket is opened unless a channel is
// subscribed, so this is zero-cost for this server client.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    // `ws` is structurally a WebSocket; its constructor type differs slightly
    // from realtime-js's, so this type-only cast is safe (verified at runtime).
    transport: WebSocket as unknown as WebSocketLikeConstructor,
  },
});
