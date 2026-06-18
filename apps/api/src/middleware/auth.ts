/**
 * Bearer-token auth middleware. Verifies the Supabase JWT and attaches the
 * authenticated user id + the application user row to the request context.
 */
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import type { UserRow } from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthVariables {
  userId: string;
  user: UserRow;
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return errorResponse(c, 'unauthorized', 'Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return errorResponse(c, 'unauthorized', 'Invalid or expired session token');
    }

    const [row] = await db.select().from(users).where(eq(users.id, data.user.id)).limit(1);
    if (!row) {
      return errorResponse(c, 'unauthorized', 'User profile not found');
    }

    c.set('userId', row.id);
    c.set('user', row);
    await next();
  },
);
