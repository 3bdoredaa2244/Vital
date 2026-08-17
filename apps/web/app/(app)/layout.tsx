'use client';

/**
 * Guard for every authenticated route. Waits for the stored session to be
 * verified against /users/me, then renders the app shell.
 */
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { AppShell } from '@/components/AppShell';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking your session" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
