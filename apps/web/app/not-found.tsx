import Link from 'next/link';

import { VitalLogo } from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <VitalLogo size={88} />
      <p className="vital-eyebrow mt-8 text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-inkSoft">
        That page doesn&apos;t exist, or it moved. Your data is safe.
      </p>
      <Link
        href="/dashboard"
        className="vital-eyebrow mt-7 rounded-md bg-accent px-5 py-3 text-canvas transition hover:bg-accent/90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
