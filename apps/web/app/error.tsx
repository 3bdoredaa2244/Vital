'use client';

/**
 * Route-level error boundary. Keeps the technical detail in the console (and
 * in the digest for server logs) while showing the user something calm.
 */
import { useEffect } from 'react';

import { VitalLogo } from '@/components/Logo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[VITAL] route error', error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <VitalLogo size={88} />
      <p className="vital-eyebrow mt-8 text-rust">Something broke</p>
      <h1 className="mt-2 font-display text-4xl text-ink">We hit an unexpected error</h1>
      <p className="mt-2 max-w-md text-sm text-inkSoft">
        This isn&apos;t your fault. Try again — if it keeps happening, contact VITAL support.
      </p>
      <button
        onClick={reset}
        className="vital-eyebrow mt-7 rounded-md bg-accent px-5 py-3 text-canvas transition hover:bg-accent/90"
      >
        Try again
      </button>
    </main>
  );
}
