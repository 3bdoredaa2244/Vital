/**
 * PlanCard — subscription plan card. Premium can be flagged as recommended,
 * and price can render as annual or monthly-equivalent.
 */
import type { SubscriptionPlan } from '@vital/shared';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { LucideIcon } from './LucideIcon';

interface Props {
  plan: SubscriptionPlan;
  recommended?: boolean;
  billing: 'annual' | 'monthly';
  selected?: boolean;
  onChoose: () => void;
}

export function PlanCard({ plan, recommended, billing, selected, onChoose }: Props) {
  const monthly = Math.round(plan.price_egp / 12);
  const accent = recommended ? colors.gold : colors.borderLight;

  return (
    <View
      className="mb-4 rounded-lg border p-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: selected ? colors.gold : accent,
        borderWidth: selected ? 2 : 1,
      }}
    >
      {recommended ? (
        <View
          className="absolute -top-3 self-center rounded-sm px-3 py-1"
          style={{ backgroundColor: colors.gold, right: 16 }}
        >
          <Text className="font-mono uppercase" style={{ color: colors.obsidian, fontSize: 9 }}>
            Most Popular
          </Text>
        </View>
      ) : null}

      <Text className="font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 12 }}>
        {plan.name}
      </Text>

      <View className="mt-2 flex-row items-end">
        <Text className="font-display" style={{ color: colors.white, fontSize: 40 }}>
          {billing === 'annual'
            ? plan.price_egp.toLocaleString()
            : monthly.toLocaleString()}
        </Text>
        <Text className="mb-2 ml-2 font-mono" style={{ color: colors.textDim, fontSize: 12 }}>
          EGP / {billing === 'annual' ? 'year' : 'mo'}
        </Text>
      </View>
      {billing === 'monthly' ? (
        <Text className="font-mono" style={{ color: colors.textMuted, fontSize: 10 }}>
          billed annually at {plan.price_egp.toLocaleString()} EGP
        </Text>
      ) : null}

      <View className="my-4" style={{ height: 1, backgroundColor: colors.border }} />

      {plan.features.map((feature) => (
        <View key={feature} className="mb-2 flex-row items-center">
          <LucideIcon name="Check" size={14} color={colors.green} />
          <Text className="ml-2 flex-1 font-body" style={{ color: colors.text, fontSize: 13 }}>
            {feature}
          </Text>
        </View>
      ))}

      <Pressable
        onPress={onChoose}
        className="mt-4 items-center rounded-md py-3"
        style={{ backgroundColor: recommended ? colors.gold : colors.borderLight }}
      >
        <Text
          className="font-mono uppercase tracking-wider"
          style={{ color: recommended ? colors.obsidian : colors.white, fontSize: 13 }}
        >
          Choose Plan
        </Text>
      </Pressable>
    </View>
  );
}
