'use client';

/**
 * Unauthenticated shell: a centred card on the warm canvas, with the VITAL
 * wordmark above it — the web reading of the mobile welcome/auth screens.
 * Signed-in visitors are bounced to the dashboard.
 */
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { VitalLogo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <VitalLogo size={96} />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-inkMuted">
        VITAL is a preventive-health platform. It does not provide medical diagnosis or treatment.
      </p>
    </main>
  );
}
