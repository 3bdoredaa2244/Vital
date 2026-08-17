'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ClientInfoInput, clientInfoSchema } from '@vital/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { OnboardingSteps } from '@/components/OnboardingSteps';
import { useToast } from '@/components/toast';
import { Button, Card, Field, Select, Textarea } from '@/components/ui';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { messageFor } from '@/lib/use-api';

export default function ClientInfoPage() {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInfoInput>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: { activity_level: 'moderate', address: '' },
  });

  const finish = () => router.replace('/dashboard');

  const onSubmit = async (data: ClientInfoInput) => {
    setSubmitting(true);
    try {
      const { user } = await userApi.updateClientInfo(data);
      setUser(user);
      finish();
    } catch (err) {
      toast.error(messageFor(err, 'Could not save your details.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-7 sm:p-8">
      <OnboardingSteps current={2} />
      <h1 className="font-display text-3xl text-ink">Where should we come?</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">
        VITAL draws blood at your home or office. You can change this any time before a visit.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Activity level" error={errors.activity_level?.message} htmlFor="activity">
          <Select id="activity" invalid={!!errors.activity_level} {...register('activity_level')}>
            <option value="sedentary">Sedentary — little or no exercise</option>
            <option value="light">Light — 1–2 days a week</option>
            <option value="moderate">Moderate — 3–4 days a week</option>
            <option value="active">Active — 5–6 days a week</option>
            <option value="very_active">Very active — daily / physical job</option>
          </Select>
        </Field>

        <Field
          label="Address"
          error={errors.address?.message}
          hint="Street, building, floor, and any landmark that helps the visiting doctor find you."
          htmlFor="address"
        >
          <Textarea
            id="address"
            rows={4}
            placeholder="12 Street 200, Degla, Maadi, Cairo — 3rd floor, apt 5"
            invalid={!!errors.address}
            {...register('address')}
          />
        </Field>

        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={finish} disabled={submitting}>
            Skip
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            Finish
          </Button>
        </div>
      </form>
    </Card>
  );
}
