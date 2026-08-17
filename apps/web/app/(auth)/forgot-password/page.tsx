'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ResetPasswordInput, resetPasswordSchema } from '@vital/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '@/components/toast';
import { Button, Card, Field, Input } from '@/components/ui';
import { ApiError, authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword(data.email);
      // The API always answers 200 here so it never reveals which addresses are
      // registered. The copy below matches that guarantee.
      setSent(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.kind === 'network'
          ? 'Could not reach the VITAL server. Is the API running?'
          : 'Could not send the reset email. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-7 text-center sm:p-8">
        <h1 className="font-display text-2xl text-ink">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-inkSoft">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 block">
          <Button variant="secondary" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-3xl text-ink">Reset password</h1>
      <p className="mb-7 mt-1 text-sm text-inkSoft">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

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

        <Button type="submit" className="w-full" loading={submitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-inkSoft">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
