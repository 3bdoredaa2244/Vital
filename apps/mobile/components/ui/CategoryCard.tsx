/**
 * CategoryCard — horizontally-scrollable category overview card. Shows icon,
 * name, biomarker count, the user's status summary, and a color-coded border.
 */
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { LucideIcon } from './LucideIcon';

interface Props {
  name: string;
  icon: string;
  color: string;
  total: number;
  optimal: number;
  review: number;
  onPress: () => void;
}

export function CategoryCard({ name, icon, color, total, optimal, review, onPress }: Props) {
  const summary =
    optimal + review === 0
      ? 'Not tested yet'
      : `${optimal} optimal · ${review} review`;

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 rounded-lg p-4"
      style={{
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: color,
        width: 160,
      }}
    >
      <View
        className="mb-3 items-center justify-center rounded-md"
        style={{ width: 36, height: 36, backgroundColor: `${color}1F` }}
      >
        <LucideIcon name={icon} size={18} color={color} />
      </View>
      <Text className="font-display" style={{ color: colors.white, fontSize: 17 }} numberOfLines={1}>
        {name}
      </Text>
      <Text className="mt-0.5 font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
        {total} markers
      </Text>
      <Text className="mt-2 font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
        {summary}
      </Text>
    </Pressable>
  );
}
