/**
 * Thin wrapper around @hono/zod-validator that formats validation failures
 * using VITAL's standard error envelope.
 */
import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

import { errorResponse } from '../lib/http.js';

export function validate<T extends ZodSchema>(
  target: keyof ValidationTargets,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return errorResponse(
        c,
        'validation_error',
        'One or more fields are invalid',
        result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      );
    }
    return undefined;
  });
}
