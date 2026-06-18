/**
 * EmptyState — centered icon + message + optional CTA. Used for "no results",
 * "no subscription", and error fallbacks.
 */
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';

interface Props {
  icon: string;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, message, ctaLabel, onCta }: Props) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <View
        className="mb-4 items-center justify-center rounded-full"
        style={{ width: 64, height: 64, backgroundColor: colors.surface }}
      >
        <LucideIcon name={icon} size={28} color={colors.textDim} />
      </View>
      <Text className="text-center font-display" style={{ color: colors.white, fontSize: 22 }}>
        {title}
      </Text>
      {message ? (
        <Text
          className="mt-2 text-center font-body"
          style={{ color: colors.textDim, fontSize: 14, lineHeight: 20 }}
        >
          {message}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View className="mt-6 w-full">
          <Button label={ctaLabel} onPress={onCta} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}
