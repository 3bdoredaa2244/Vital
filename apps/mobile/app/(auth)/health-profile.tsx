/**
 * Health Profile — multi-step, one-question-per-screen form with a progress
 * bar. Steps: DOB → gender → measurements → conditions → family history.
 * Progress is held in the onboarding store so the user can resume.
 */
import { healthProfileSchema } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, LucideIcon, ProgressBar, Screen, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, userApi } from '@/lib/api';
import { calculateAge, calculateBmi } from '@/lib/format';
import { useAuthStore } from '@/lib/store/auth';
import { useOnboardingStore } from '@/lib/store/onboarding';
import type { ChronicCondition, Gender } from '@vital/shared';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const CONDITIONS: { value: ChronicCondition; label: string }[] = [
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'thyroid', label: 'Thyroid' },
  { value: 'none', label: 'None' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function StepTitle({ children }: { children: string }) {
  return (
    <Text className="mb-6 font-display" style={{ color: colors.white, fontSize: 30, lineHeight: 36 }}>
      {children}
    </Text>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center justify-between rounded-md border px-4 py-4"
      style={{
        backgroundColor: selected ? `${colors.gold}1A` : colors.surface,
        borderColor: selected ? colors.gold : colors.border,
      }}
    >
      <Text className="font-body" style={{ color: colors.white, fontSize: 15 }}>
        {label}
      </Text>
      {selected ? <LucideIcon name="Check" size={18} color={colors.gold} /> : null}
    </Pressable>
  );
}

export default function HealthProfile() {
  const router = useRouter();
  const store = useOnboardingStore();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [saving, setSaving] = useState(false);

  const toggleCondition = (
    key: 'chronicConditions' | 'familyHistory',
    value: ChronicCondition,
  ) => {
    const current = store[key];
    // "None" / "prefer not to say" are exclusive.
    if (value === 'none' || value === 'prefer_not_to_say') {
      store.setField(key, current.includes(value) ? [] : [value]);
      return;
    }
    const cleaned = current.filter((c) => c !== 'none' && c !== 'prefer_not_to_say');
    store.setField(
      key,
      cleaned.includes(value) ? cleaned.filter((c) => c !== value) : [...cleaned, value],
    );
  };

  const canContinue = (): boolean => {
    switch (store.step) {
      case 'dob':
        return !!store.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(store.dateOfBirth);
      case 'gender':
        return !!store.gender;
      default:
        return true;
    }
  };

  const finish = async () => {
    const payload = store.toHealthProfile();
    if (!payload) {
      toast.error('Date of birth and gender are required');
      return;
    }
    const parsed = healthProfileSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please check your answers');
      return;
    }
    setSaving(true);
    try {
      await userApi.updateHealthProfile(parsed.data);
      await refreshUser();
      router.replace('/(auth)/client-info');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const onNext = () => {
    if (store.step === 'family_history') {
      void finish();
      return;
    }
    store.next();
  };

  const age = store.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(store.dateOfBirth)
    ? calculateAge(store.dateOfBirth)
    : null;
  const bmi =
    store.heightCm && store.weightKg ? calculateBmi(store.heightCm, store.weightKg) : null;

  return (
    <Screen scroll>
      <View className="mb-8 mt-4">
        <ProgressBar progress={store.progress()} />
      </View>

      {store.step === 'dob' ? (
        <View>
          <StepTitle>When were you born?</StepTitle>
          <TextInput
            value={store.dateOfBirth ?? ''}
            onChangeText={(t) => store.setField('dateOfBirth', t)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            className="rounded-md border px-4 py-3 font-body"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.white, fontSize: 16 }}
          />
          {age !== null ? (
            <Text className="mt-3 font-mono" style={{ color: colors.gold, fontSize: 13 }}>
              {age} years old
            </Text>
          ) : null}
        </View>
      ) : null}

      {store.step === 'gender' ? (
        <View>
          <StepTitle>What's your sex?</StepTitle>
          {GENDERS.map((g) => (
            <Choice
              key={g.value}
              label={g.label}
              selected={store.gender === g.value}
              onPress={() => store.setField('gender', g.value)}
            />
          ))}
        </View>
      ) : null}

      {store.step === 'measurements' ? (
        <View>
          <StepTitle>Height & weight</StepTitle>
          <Text className="mb-2 font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>
            Height (cm)
          </Text>
          <TextInput
            value={store.heightCm ? String(store.heightCm) : ''}
            onChangeText={(t) => store.setField('heightCm', t ? Number(t) : null)}
            keyboardType="numeric"
            placeholder="175"
            placeholderTextColor={colors.textMuted}
            className="mb-4 rounded-md border px-4 py-3 font-body"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.white, fontSize: 16 }}
          />
          <Text className="mb-2 font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>
            Weight (kg)
          </Text>
          <TextInput
            value={store.weightKg ? String(store.weightKg) : ''}
            onChangeText={(t) => store.setField('weightKg', t ? Number(t) : null)}
            keyboardType="numeric"
            placeholder="72"
            placeholderTextColor={colors.textMuted}
            className="rounded-md border px-4 py-3 font-body"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.white, fontSize: 16 }}
          />
          {bmi ? (
            <Text className="mt-3 font-mono" style={{ color: colors.gold, fontSize: 13 }}>
              BMI {bmi.value} · {bmi.category}
            </Text>
          ) : null}
          <Text className="mt-3 font-body" style={{ color: colors.textMuted, fontSize: 12 }}>
            Optional — you can skip this step.
          </Text>
        </View>
      ) : null}

      {store.step === 'conditions' ? (
        <View>
          <StepTitle>Any chronic conditions?</StepTitle>
          {CONDITIONS.map((c) => (
            <Choice
              key={c.value}
              label={c.label}
              selected={store.chronicConditions.includes(c.value)}
              onPress={() => toggleCondition('chronicConditions', c.value)}
            />
          ))}
        </View>
      ) : null}

      {store.step === 'family_history' ? (
        <View>
          <StepTitle>Any family history?</StepTitle>
          {CONDITIONS.map((c) => (
            <Choice
              key={c.value}
              label={c.label}
              selected={store.familyHistory.includes(c.value)}
              onPress={() => toggleCondition('familyHistory', c.value)}
            />
          ))}
        </View>
      ) : null}

      <View className="mt-8" style={{ gap: 12 }}>
        <Button
          label={store.step === 'family_history' ? 'Finish' : 'Continue'}
          onPress={onNext}
          loading={saving}
          disabled={!canContinue()}
        />
        {store.step !== 'dob' ? (
          <Button label="Back" variant="ghost" onPress={() => store.back()} />
        ) : null}
      </View>
    </Screen>
  );
}
