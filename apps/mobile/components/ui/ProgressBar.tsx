/**
 * ProgressBar — thin animated progress indicator used at the top of the
 * multi-step onboarding flow.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';

interface Props {
  /** 0..1 */
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  const value = useSharedValue(progress);

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 300 });
  }, [progress, value]);

  const style = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View
      className="overflow-hidden rounded-full"
      style={{ height: 4, backgroundColor: colors.border }}
    >
      <Animated.View style={[{ height: '100%', backgroundColor: colors.gold }, style]} />
    </View>
  );
}
