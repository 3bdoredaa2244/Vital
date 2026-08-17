'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CHRONIC_CONDITIONS,
  type ChronicCondition,
  type HealthProfileInput,
  healthProfileSchema,
} from '@vital/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { OnboardingSteps } from '@/components/OnboardingSteps';
import { useToast } from '@/components/toast';
import { Button, Card, Field, Input, Select } from '@/components/ui';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { messageFor } from '@/lib/use-api';

const CONDITION_LABELS: Record<ChronicCondition, string> = {
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  thyroid: 'Thyroid condition',
  none: 'None',
  prefer_not_to_say: 'Prefer not to say',
};

/** Multi-select chip group — the web reading of the mobile pill selector. */
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly ChronicCondition[];
  value: ChronicCondition[];
  onChange: (next: ChronicCondition[]) => void;
}) {
  const toggle = (opt: ChronicCondition) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={`rounded-md border px-3 py-2 text-[13px] transition ${
              active
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line bg-panel text-inkSoft hover:border-accentSoft hover:text-ink'
            }`}
          >
            {CONDITION_LABELS[opt]}
          </button>
        );
      })}
    </div>
  );
}

export default function HealthProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HealthProfileInput>({
    resolver: zodResolver(healthProfileSchema),
    defaultValues: {
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      chronic_conditions: [],
      family_history: [],
    },
  });

  const onSubmit = async (data: HealthProfileInput) => {
    setSubmitting(true);
    try {
      const { user } = await userApi.updateHealthProfile(data);
      setUser(user);
      router.push('/onboarding/goals');
    } catch (err) {
      toast.error(messageFor(err, 'Could not save your health profile.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-7 sm:p-8">
      <OnboardingSteps current={0} />
      <h1 className="font-display text-3xl text-ink">Your health profile</h1>
      <p className="mb-7 mt-1 text-sm text-inkSoft">
        Age and sex are required to calculate your biological age and personalise your reference
        ranges.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Date of birth" error={errors.date_of_birth?.message} htmlFor="dob">
            <Input id="dob" type="date" invalid={!!errors.date_of_birth} {...register('date_of_birth')} />
          </Field>

          <Field label="Sex" error={errors.gender?.message} htmlFor="gender">
            <Select id="gender" invalid={!!errors.gender} {...register('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          </Field>

          <Field label="Height (cm)" error={errors.height_cm?.message} htmlFor="height">
            <Input
              id="height"
              type="number"
              placeholder="175"
              invalid={!!errors.height_cm}
              {...register('height_cm', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
          </Field>

          <Field label="Weight (kg)" error={errors.weight_kg?.message} htmlFor="weight">
            <Input
              id="weight"
              type="number"
              placeholder="72"
              invalid={!!errors.weight_kg}
              {...register('weight_kg', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
          </Field>
        </div>

        <Field label="Chronic conditions" error={errors.chronic_conditions?.message}>
          <Controller
            control={control}
            name="chronic_conditions"
            render={({ field }) => (
              <ChipGroup
                options={CHRONIC_CONDITIONS}
                value={(field.value ?? []) as ChronicCondition[]}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        <Field label="Family history" error={errors.family_history?.message}>
          <Controller
            control={control}
            name="family_history"
            render={({ field }) => (
              <ChipGroup
                options={CHRONIC_CONDITIONS}
                value={(field.value ?? []) as ChronicCondition[]}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        <div className="mt-6 flex gap-3">
          <Button type="submit" className="flex-1" loading={submitting}>
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}
