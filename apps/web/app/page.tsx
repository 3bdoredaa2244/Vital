'use client';

/**
 * Entry route. Sends the visitor to the dashboard or the sign-in screen once
 * the stored session has been checked.
 */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingState } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function IndexPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
    else if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  return <LoadingState label="Starting VITAL" />;
}
