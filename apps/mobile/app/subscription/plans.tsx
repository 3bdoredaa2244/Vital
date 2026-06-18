/**
 * Plans — Basic vs Premium plan cards with an annual/monthly billing toggle and
 * a feature-by-feature comparison table.
 */
import type { SubscriptionPlan } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LucideIcon, PlanCard, Screen, SkeletonList, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { subscriptionApi } from '@/lib/api';

const COMPARISON: { label: string; basic: string; premium: string }[] = [
  { label: 'Annual tests', basic: '1', premium: '2' },
  { label: 'Biomarkers', basic: '60+', premium: '80+' },
  { label: 'Dashboard access', basic: '✓', premium: '✓' },
  { label: 'Historical tracking', basic: '✓', premium: '✓' },
  { label: 'Optimal vs normal ranges', basic: '—', premium: '✓' },
  { label: 'Priority new features', basic: '—', premium: '✓' },
  { label: 'Supplement guidance', basic: '—', premium: 'Phase 2' },
];

export default function Plans() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');

  useEffect(() => {
    subscriptionApi
      .plans()
      .then((res) => setPlans(res.plans))
      .catch(() => toast.error('Could not load plans'))
      .finally(() => setLoading(false));
  }, []);

  const choose = (plan: SubscriptionPlan) => {
    router.push({ pathname: '/subscription/checkout', params: { planId: plan.id } });
  };

  const premium = plans.find((p) => p.name === 'premium');
  const ordered = [...plans].sort((a, b) => a.price_egp - b.price_egp);

  return (
    <Screen scroll>
      <Text className="mb-1 mt-6 font-display" style={{ color: colors.white, fontSize: 32 }}>
        Choose your plan
      </Text>
      <Text className="mb-5 font-body" style={{ color: colors.textDim, fontSize: 14 }}>
        Comprehensive testing, longitudinal tracking, optimal ranges.
      </Text>

      {/* Billing toggle */}
      <View
        className="mb-6 flex-row rounded-md border p-1"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {(['annual', 'monthly'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setBilling(mode)}
            className="flex-1 items-center rounded-sm py-2"
            style={{ backgroundColor: billing === mode ? colors.borderLight : 'transparent' }}
          >
            <Text
              className="font-mono uppercase"
              style={{ color: billing === mode ? colors.white : colors.textDim, fontSize: 11 }}
            >
              {mode === 'annual' ? 'Annual' : 'Monthly equiv.'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <SkeletonList count={2} />
      ) : (
        ordered.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            recommended={plan.name === 'premium'}
            billing={billing}
            onChoose={() => choose(plan)}
          />
        ))
      )}

      {/* Comparison table */}
      {!loading && premium ? (
        <View className="mt-4">
          <Text className="mb-3 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 12 }}>
            Compare
          </Text>
          <View className="rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row border-b px-4 py-3" style={{ borderColor: colors.border }}>
              <Text className="flex-1 font-mono" style={{ color: colors.textDim, fontSize: 11 }}>
                FEATURE
              </Text>
              <Text className="w-16 text-center font-mono" style={{ color: colors.textDim, fontSize: 11 }}>
                BASIC
              </Text>
              <Text className="w-16 text-center font-mono" style={{ color: colors.gold, fontSize: 11 }}>
                PREMIUM
              </Text>
            </View>
            {COMPARISON.map((row, i) => (
              <View
                key={row.label}
                className="flex-row items-center px-4 py-3"
                style={{ borderColor: colors.border, borderBottomWidth: i < COMPARISON.length - 1 ? 1 : 0 }}
              >
                <Text className="flex-1 font-body" style={{ color: colors.text, fontSize: 13 }}>
                  {row.label}
                </Text>
                <Text className="w-16 text-center font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                  {row.basic}
                </Text>
                <Text className="w-16 text-center font-body" style={{ color: colors.white, fontSize: 13 }}>
                  {row.premium}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable className="mt-8 items-center" onPress={() => router.replace('/(tabs)/dashboard')}>
        <View className="flex-row items-center">
          <LucideIcon name="ArrowLeft" size={14} color={colors.textDim} />
          <Text className="ml-1.5 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
            Maybe later
          </Text>
        </View>
      </Pressable>
    </Screen>
  );
}
