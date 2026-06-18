/**
 * `requireAdmin` — gates the admin dashboard. Must run AFTER `requireAuth`.
 */
import { createMiddleware } from 'hono/factory';

import { errorResponse } from '../lib/http.js';
import type { AuthVariables } from './auth.js';

export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return errorResponse(c, 'forbidden', 'Administrator access required');
    }
    await next();
  },
);
