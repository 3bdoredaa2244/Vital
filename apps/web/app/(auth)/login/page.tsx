'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@vital/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '@/components/toast';
import { Button, Card, Field, Input } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (err) {
      // Distinguish "wrong password" from "server unreachable" — the mobile app
      // collapses both into one message; here the user can act on the answer.
      if (err instanceof ApiError) {
        if (err.kind === 'network') {
          toast.error('Could not reach the VITAL server. Is the API running?');
        } else if (err.kind === 'auth' || err.status === 401) {
          toast.error('That email and password combination is not correct.');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Could not sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-3xl text-ink">Welcome back</h1>
      <p className="mb-7 mt-1 text-sm text-inkSoft">Sign in to see what your markers are telling you.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email" error={errors.email?.message} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Password" error={errors.password?.message} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <div className="mb-6 -mt-1 text-right">
          <Link href="/forgot-password" className="text-[13px] text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-inkSoft">
        New to VITAL?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
