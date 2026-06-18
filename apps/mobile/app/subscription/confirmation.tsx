/**
 * Confirmation — animated success state with subscription details and the two
 * follow-up CTAs (dashboard + book first test).
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button, LucideIcon, Screen, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSubscriptionStore } from '@/lib/store/subscription';

export default function Confirmation() {
  const router = useRouter();
  const subscription = useSubscriptionStore((s) => s.subscription);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, { damping: 6 }), withTiming(1, { duration: 200 }));
  }, [scale]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          style={[
            {
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: `${colors.green}26`,
              alignItems: 'center',
              justifyContent: 'center',
            },
            checkStyle,
          ]}
        >
          <LucideIcon name="Check" size={48} color={colors.green} />
        </Animated.View>

        <Text className="mt-6 text-center font-display" style={{ color: colors.white, fontSize: 32 }}>
          You're all set
        </Text>
        <Text className="mt-2 text-center font-body" style={{ color: colors.textDim, fontSize: 14, lineHeight: 20 }}>
          Your VITAL subscription is active. Welcome aboard.
        </Text>

        {subscription ? (
          <View
            className="mt-8 w-full rounded-lg border p-5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>Plan</Text>
              <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>
                {subscription.plan.name}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>Tests / year</Text>
              <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>
                {subscription.plan.annual_tests_count}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>Expires</Text>
              <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>
                {new Date(subscription.expires_at).toLocaleDateString('en-GB')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="px-2 pb-8" style={{ gap: 12 }}>
        <Button label="View Your Dashboard" onPress={() => router.replace('/(tabs)/dashboard')} />
        <Button
          label="Book Your First Test"
          variant="secondary"
          icon="Calendar"
          onPress={() => toast.info('Lab partner booking opens in-app — coming with your first panel')}
        />
      </View>
    </Screen>
  );
}
