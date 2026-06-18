/**
 * User profile routes. All require auth.
 */
import { clientInfoSchema, goalsSchema, healthProfileSchema, updateUserSchema } from '@vital/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import { serializeUser } from '../lib/serialize.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const userRoutes = new Hono<{ Variables: AuthVariables }>();

userRoutes.use('*', requireAuth);

userRoutes.get('/me', (c) => {
  return c.json({ user: serializeUser(c.get('user')) });
});

userRoutes.put('/me', validate('json', updateUserSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  const [row] = await db
    .update(users)
    .set({
      ...(body.full_name !== undefined ? { fullName: body.full_name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!row) return errorResponse(c, 'not_found', 'User not found');
  return c.json({ user: serializeUser(row) });
});

userRoutes.put('/me/health-profile', validate('json', healthProfileSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  const [row] = await db
    .update(users)
    .set({
      dateOfBirth: body.date_of_birth,
      gender: body.gender,
      heightCm: body.height_cm ?? null,
      weightKg: body.weight_kg ?? null,
      chronicConditions: body.chronic_conditions ?? [],
      familyHistory: body.family_history ?? [],
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!row) return errorResponse(c, 'not_found', 'User not found');
  return c.json({ user: serializeUser(row) });
});

userRoutes.put('/me/client-info', validate('json', clientInfoSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');

  const [row] = await db
    .update(users)
    .set({
      ...(body.activity_level !== undefined ? { activityLevel: body.activity_level } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.latitude !== undefined ? { latitude: String(body.latitude) } : {}),
      ...(body.longitude !== undefined ? { longitude: String(body.longitude) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!row) return errorResponse(c, 'not_found', 'User not found');
  return c.json({ user: serializeUser(row) });
});

userRoutes.put('/me/goals', validate('json', goalsSchema), async (c) => {
  const userId = c.get('userId');
  const { health_goals } = c.req.valid('json');

  const [row] = await db
    .update(users)
    .set({ healthGoals: health_goals, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!row) return errorResponse(c, 'not_found', 'User not found');
  return c.json({ user: serializeUser(row) });
});
