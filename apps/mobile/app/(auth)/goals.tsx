/**
 * Health Goals — card grid; user selects up to 3. On completion saves to
 * users.health_goals and routes to the subscription plans.
 */
import type { HealthGoalOption } from '@vital/shared';
import { goalsSchema, type HealthGoal } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button, LucideIcon, Screen, toast } from '@/components/ui';
import { HEALTH_GOAL_OPTIONS } from '@/constants/biomarkers';
import { colors } from '@/constants/theme';
import { ApiError, contentApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useOnboardingStore } from '@/lib/store/onboarding';

const MAX = 3;
const FALLBACK: HealthGoalOption[] = HEALTH_GOAL_OPTIONS.map((g) => ({ ...g, id: g.value, slug: g.value, display_order: 0, is_active: true }));

export default function Goals() {
  const router = useRouter();
  const selected = useOnboardingStore((s) => s.healthGoals);
  const setField = useOnboardingStore((s) => s.setField);
  const reset = useOnboardingStore((s) => s.reset);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [saving, setSaving] = useState(false);
  const [goalOptions, setGoalOptions] = useState<HealthGoalOption[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  useEffect(() => {
    contentApi.goals()
      .then((r) => setGoalOptions(r.goals.filter((g) => g.is_active)))
      .catch(() => setGoalOptions(FALLBACK))
      .finally(() => setLoadingGoals(false));
  }, []);

  const toggle = (goal: HealthGoal) => {
    if (selected.includes(goal)) {
      setField('healthGoals', selected.filter((g) => g !== goal));
    } else if (selected.length < MAX) {
      setField('healthGoals', [...selected, goal]);
    } else {
      toast.info(`Pick up to ${MAX} goals`);
    }
  };

  const onContinue = async () => {
    const parsed = goalsSchema.safeParse({ health_goals: selected });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Pick at least one goal');
      return;
    }
    setSaving(true);
    try {
      await userApi.updateGoals(parsed.data);
      await refreshUser();
      reset();
      router.replace('/subscription/plans');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save goals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text className="mb-1 mt-6 font-display" style={{ color: colors.white, fontSize: 32 }}>
        What matters most?
      </Text>
      <Text className="mb-6 font-body" style={{ color: colors.textDim, fontSize: 14 }}>
        Choose up to {MAX}. We'll tailor your experience.
      </Text>

      {loadingGoals ? (
        <ActivityIndicator color={colors.gold} style={{ marginVertical: 32 }} />
      ) : null}

      <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
        {goalOptions.map((g) => {
          const isSelected = selected.includes(g.slug);
          return (
            <View key={g.id} style={{ width: '50%', padding: 6 }}>
              <Pressable
                onPress={() => toggle(g.slug)}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: isSelected ? `${colors.gold}1A` : colors.surface,
                  borderColor: isSelected ? colors.gold : colors.border,
                  minHeight: 120,
                }}
              >
                <LucideIcon
                  name={g.icon}
                  size={24}
                  color={isSelected ? colors.gold : colors.textDim}
                />
                <Text
                  className="mt-3 font-body"
                  style={{ color: colors.white, fontSize: 14, lineHeight: 19 }}
                >
                  {g.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text className="mt-4 text-center font-mono" style={{ color: colors.textDim, fontSize: 12 }}>
        {selected.length}/{MAX} selected
      </Text>

      <View className="mt-6">
        <Button label="Continue" onPress={onContinue} loading={saving} disabled={selected.length === 0} />
      </View>
    </Screen>
  );
}
