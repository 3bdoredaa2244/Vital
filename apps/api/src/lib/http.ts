/**
 * Standard API error helpers. Every error response follows the contract:
 *   { error: { code, message, details? } }
 */
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ErrorCode =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'unprocessable'
  | 'conflict'
  | 'payment_error'
  | 'server_error';

const STATUS_BY_CODE: Record<ErrorCode, ContentfulStatusCode> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  unprocessable: 422,
  conflict: 409,
  payment_error: 402,
  server_error: 500,
};

export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export function fail(code: ErrorCode, message: string, details?: unknown): never {
  throw new ApiException(code, message, details);
}

export function errorResponse(c: Context, code: ErrorCode, message: string, details?: unknown) {
  return c.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    STATUS_BY_CODE[code],
  );
}

export function statusForCode(code: ErrorCode): ContentfulStatusCode {
  return STATUS_BY_CODE[code];
}
