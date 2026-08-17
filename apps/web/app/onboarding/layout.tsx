'use client';

/**
 * Onboarding shell — mirrors the mobile post-signup flow:
 * health profile → goals → client info. Requires a session but sits outside
 * the app shell, because the user has no data to navigate yet.
 */
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { VitalLogo } from '@/components/Logo';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return <LoadingState />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <VitalLogo size={80} />
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </main>
  );
}
