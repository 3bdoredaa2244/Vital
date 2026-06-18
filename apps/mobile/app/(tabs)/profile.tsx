/**
 * Profile — user details, health profile summary, goals, subscription, and
 * sign-out.
 */
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, LucideIcon, SectionHeader } from '@/components/ui';
import { HEALTH_GOAL_OPTIONS } from '@/constants/biomarkers';
import { colors } from '@/constants/theme';
import { calculateAge, calculateBmi } from '@/lib/format';
import { useAuthStore } from '@/lib/store/auth';
import { useLibraryStore } from '@/lib/store/library';
import { useSubscriptionStore } from '@/lib/store/subscription';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2.5">
      <Text className="font-mono uppercase" style={{ color: colors.textDim, fontSize: 11 }}>
        {label}
      </Text>
      <Text className="font-body" style={{ color: colors.text, fontSize: 14 }}>
        {value}
      </Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const clearSub = useSubscriptionStore((s) => s.clear);

  const onSignOut = async () => {
    await signOut();
    clearSub();
    useLibraryStore.setState({ loaded: false, biomarkers: [], categories: [] });
    router.replace('/(auth)/welcome');
  };

  const bmi =
    user?.height_cm && user?.weight_kg ? calculateBmi(user.height_cm, user.weight_kg) : null;

  const goalLabels = (user?.health_goals ?? [])
    .map((g) => HEALTH_GOAL_OPTIONS.find((o) => o.value === g)?.label ?? g)
    .join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-4">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 72, height: 72, backgroundColor: colors.surface }}
          >
            <LucideIcon name="User" size={32} color={colors.gold} />
          </View>
          <Text className="mt-3 font-display" style={{ color: colors.white, fontSize: 26 }}>
            {user?.full_name ?? 'Your profile'}
          </Text>
          <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>
            {user?.email}
          </Text>
        </View>

        <View className="mt-4">
          <SectionHeader title="Health profile" />
          <View className="rounded-lg border px-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {user?.date_of_birth ? <Row label="Age" value={`${calculateAge(user.date_of_birth)} yrs`} /> : null}
            {user?.gender ? <Row label="Sex" value={user.gender.replace(/_/g, ' ')} /> : null}
            {user?.height_cm ? <Row label="Height" value={`${user.height_cm} cm`} /> : null}
            {user?.weight_kg ? <Row label="Weight" value={`${user.weight_kg} kg`} /> : null}
            {bmi ? <Row label="BMI" value={`${bmi.value} (${bmi.category})`} /> : null}
          </View>
        </View>

        {goalLabels ? (
          <View className="mt-6">
            <SectionHeader title="Goals" />
            <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                {goalLabels}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mt-6">
          <SectionHeader title="Subscription" />
          <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {subscription ? (
              <>
                <Text className="font-mono uppercase" style={{ color: colors.gold, fontSize: 11 }}>
                  {subscription.plan.name} · {subscription.status}
                </Text>
                <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                  Renews {new Date(subscription.expires_at).toLocaleDateString('en-GB')}
                </Text>
              </>
            ) : (
              <Button label="View Plans" variant="secondary" onPress={() => router.push('/subscription/plans')} />
            )}
          </View>
        </View>

        <View className="mt-8">
          <Button label="Sign Out" variant="ghost" icon="LogOut" onPress={onSignOut} />
        </View>
      </ScrollView>
    </View>
  );
}
