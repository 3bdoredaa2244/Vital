/**
 * SkeletonLoader — animated shimmer placeholder for loading states.
 */
import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';

interface Props {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 4, className }: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={className}
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

/** A list of skeleton card rows, used while the biomarker library loads. */
export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="mb-3 flex-row items-center rounded-lg p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Skeleton width={40} height={40} radius={20} />
          <View className="ml-3 flex-1">
            <Skeleton width="60%" height={14} />
            <View style={{ height: 8 }} />
            <Skeleton width="35%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}
