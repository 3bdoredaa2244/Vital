/**
 * Auth routes. Wraps Supabase Auth for signup/login/logout/reset and mirrors
 * the user into our application `users` table on signup.
 */
import { loginSchema, resetPasswordSchema, signupSchema } from '@vital/shared';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import { serializeUser } from '../lib/serialize.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { validate } from '../middleware/validate.js';

export const authRoutes = new Hono();

authRoutes.post('/signup', validate('json', signupSchema), async (c) => {
  const { email, password, full_name, phone } = c.req.valid('json');

  // Create the Supabase auth user (email confirmation handled by Supabase).
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: false,
    user_metadata: { full_name },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already')) {
      return errorResponse(c, 'conflict', 'An account with this email already exists');
    }
    return errorResponse(c, 'unprocessable', error?.message ?? 'Could not create account');
  }

  const [row] = await db
    .insert(users)
    .values({
      id: data.user.id,
      email,
      fullName: full_name,
      phone,
    })
    .returning();

  if (!row) {
    return errorResponse(c, 'server_error', 'Failed to persist user profile');
  }

  // Issue a session immediately so the client can proceed to onboarding.
  const { data: session } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  return c.json(
    {
      user: serializeUser(row),
      access_token: session?.session?.access_token ?? null,
      refresh_token: session?.session?.refresh_token ?? null,
    },
    201,
  );
});

authRoutes.post('/login', validate('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return errorResponse(c, 'unauthorized', 'Invalid email or password');
  }

  return c.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_id: data.user.id,
  });
});

authRoutes.post('/logout', async (c) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (token) {
    await supabaseAdmin.auth.admin.signOut(token).catch(() => undefined);
  }
  return c.json({ success: true });
});

authRoutes.post('/reset-password', validate('json', resetPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');
  // Always 200 to avoid leaking which emails are registered.
  await supabaseAdmin.auth.resetPasswordForEmail(email).catch(() => undefined);
  return c.json({ success: true });
});
