'use client';

/**
 * Small data-fetching hook. Every authenticated page uses it so loading, error,
 * and the subscription gate behave identically everywhere.
 *
 * Deliberately dependency-free: the app has one consumer per endpoint and no
 * cross-page cache requirements, so a query library would be weight without
 * benefit. If shared caching is needed later, swap the internals here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from './api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** True when the API refused because the user has no active subscription. */
  locked: boolean;
  reload: () => void;
  /** Optimistically replace the cached value (after a local mutation). */
  set: (next: T) => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  // Keep the latest fetcher without making it a dependency of the effect —
  // callers pass inline closures, which would otherwise refetch every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError('unknown', 'Something went wrong. Please try again.', 0, 'server'),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data,
    loading,
    error,
    locked: !!error && error.kind === 'forbidden',
    reload,
    set: setData,
  };
}

/**
 * Turns a thrown error into a sentence worth showing a user. Technical detail
 * is already logged by the API client; this is the human-facing half.
 */
export function messageFor(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.kind) {
    case 'network':
      return 'Could not reach the VITAL server. Check your connection and try again.';
    case 'auth':
      return 'Your session has expired. Please sign in again.';
    case 'validation':
      // The API's validation messages are already user-facing and specific.
      return err.message;
    default:
      return err.message || fallback;
  }
}
