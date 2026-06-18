/**
 * SectionHeader — section title (mono, uppercase) with an optional right action.
 */
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, right }: Props) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1">
        <Text
          className="font-mono uppercase tracking-widest"
          style={{ color: colors.gold, fontSize: 12 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text className="font-mono" style={{ color: colors.cyan, fontSize: 12 }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null)}
    </View>
  );
}
