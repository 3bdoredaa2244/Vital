/**
 * `requireLabPartner` — gates the lab partner portal. Must run AFTER `requireAuth`.
 */
import { createMiddleware } from 'hono/factory';

import { errorResponse } from '../lib/http.js';
import type { AuthVariables } from './auth.js';

export const requireLabPartner = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const user = c.get('user');
    if (!user || user.role !== 'lab_partner') {
      return errorResponse(c, 'forbidden', 'Lab partner access required');
    }
    await next();
  },
);
