/**
 * Dashboard — at-a-glance overview: greeting, the VITAL Score hero, category
 * summaries, and prompts to subscribe / book a first test.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VitalLogo } from '@/components/Logo';
import { CategoryCard, EmptyState, LucideIcon, SectionHeader } from '@/components/ui';
import { colors, statusColors } from '@/constants/theme';
import { aiApi, notificationApi } from '@/lib/api';
import { summariseByCategory } from '@/lib/library-select';
import { useAuthStore } from '@/lib/store/auth';
import { useLibraryStore } from '@/lib/store/library';
import { useScoreStore } from '@/lib/store/score';
import { useSubscriptionStore } from '@/lib/store/subscription';

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const hasActive = useSubscriptionStore((s) => s.hasActive);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subLoaded = useSubscriptionStore((s) => s.loaded);
  const { biomarkers, categories, fetch } = useLibraryStore();
  const fetchScore = useScoreStore((s) => s.fetch);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (hasActive()) {
      void fetch();
      void fetchScore(true);
      notificationApi.feed().then((r) => setUnread(r.unread_count)).catch(() => {});
    }
  }, [hasActive, fetch, fetchScore]);

  useEffect(() => {
    aiApi.status().then((r) => setAiEnabled(r.status.enabled)).catch(() => {});
  }, []);

  const summaries = useMemo(() => summariseByCategory(biomarkers), [biomarkers]);

  // Status breakdown for the count-bar hero (a count of statuses — not a score).
  const counts = useMemo(() => {
    const c = { optimal: 0, suboptimal: 0, alert: 0, untested: 0 };
    for (const b of biomarkers) c[b.status] += 1;
    return c;
  }, [biomarkers]);
  const tested = counts.optimal + counts.suboptimal + counts.alert;
  const maxCount = Math.max(counts.optimal, counts.suboptimal, counts.alert, 1);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 px-5">
          <VitalLogo size={92} />
        </View>

        <View className="flex-row items-start justify-between px-5">
          <View>
            <Text className="font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 12 }}>
              Welcome back
            </Text>
            <Text className="mt-1 font-display" style={{ color: colors.white, fontSize: 34 }}>
              {firstName}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={10} className="mt-2">
            <LucideIcon name="Bell" size={24} color={colors.white} />
            {unread > 0 ? (
              <View
                className="absolute items-center justify-center rounded-full"
                style={{ top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, backgroundColor: colors.red }}
              >
                <Text className="font-mono" style={{ color: colors.white, fontSize: 10 }}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {subLoaded && !hasActive() ? (
          <View className="mt-6 px-5">
            <EmptyState
              icon="Sparkles"
              title="Start your health journey"
              message="Subscribe to unlock 80+ biomarkers and begin tracking what matters."
              ctaLabel="View Plans"
              onCta={() => router.push('/subscription/plans')}
            />
          </View>
        ) : (
          <>
            {/* Count-bar hero — status breakdown (tap → Labs Summary) */}
            {tested > 0 ? (
              <Pressable className="mt-6 px-5" onPress={() => router.push('/(tabs)/biomarkers')}>
                <View
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text
                      className="font-mono uppercase tracking-widest"
                      style={{ color: colors.gold, fontSize: 11 }}
                    >
                      Biomarkers
                    </Text>
                    <LucideIcon name="ChevronRight" size={16} color={colors.textDim} />
                  </View>
                  <View className="flex-row items-end justify-between" style={{ height: 140 }}>
                    {[
                      { label: 'Optimal', n: counts.optimal, c: statusColors.optimal },
                      { label: 'Review', n: counts.suboptimal, c: statusColors.suboptimal },
                      { label: 'Out of Range', n: counts.alert, c: statusColors.alert },
                    ].map((b) => (
                      <View
                        key={b.label}
                        className="flex-1 items-center justify-end"
                        style={{ height: '100%' }}
                      >
                        <Text className="font-display" style={{ color: b.c, fontSize: 30 }}>
                          {b.n}
                        </Text>
                        <Text
                          className="font-body"
                          style={{ color: colors.textDim, fontSize: 12, marginTop: 2, marginBottom: 8 }}
                        >
                          {b.label}
                        </Text>
                        <View
                          style={{
                            width: '64%',
                            borderRadius: 8,
                            backgroundColor: b.c,
                            height: Math.max(8, (b.n / maxCount) * 84),
                          }}
                        />
                      </View>
                    ))}
                  </View>
                  <Text className="mt-3 font-body" style={{ color: colors.textDim, fontSize: 14 }}>
                    <Text style={{ color: colors.white, fontWeight: '700' }}>{counts.optimal}</Text> of{' '}
                    {tested} markers optimal
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {/* AI + Recommendations entries */}
            <View className="mt-4 px-5" style={{ gap: 10 }}>
              <DashCard
                icon="Activity"
                title="VITAL Score"
                subtitle="Your overall health score & trend"
                onPress={() => router.push('/score')}
              />
              {aiEnabled ? (
                <DashCard
                  icon="Sparkles"
                  title="VITAL AI"
                  subtitle="Insights & answers from your results"
                  onPress={() => router.push('/insights')}
                />
              ) : null}
              <DashCard
                icon="ClipboardList"
                title="Recommendations"
                subtitle="Supplements & lifestyle tailored to you"
                onPress={() => router.push('/recommendations')}
              />
              <DashCard
                icon="CalendarCheck"
                title="Book a Test"
                subtitle="Schedule a home blood draw near you"
                onPress={() => router.push('/booking')}
              />
            </View>

            {/* Subscription summary */}
            {subscription ? (
              <View className="mt-4 px-5">
                <View
                  className="rounded-lg border p-4"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <Text className="font-mono uppercase" style={{ color: colors.gold, fontSize: 11 }}>
                    {subscription.plan.name} plan
                  </Text>
                  <Text className="mt-1 font-body" style={{ color: colors.text, fontSize: 13 }}>
                    {subscription.plan.annual_tests_count} tests / year · renews{' '}
                    {new Date(subscription.expires_at).toLocaleDateString('en-GB')}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Category summaries */}
            {categories.length > 0 ? (
              <View className="mt-6">
                <View className="px-5">
                  <SectionHeader
                    title="Categories"
                    actionLabel="See all"
                    onAction={() => router.push('/(tabs)/biomarkers')}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {categories.map((c) => {
                    const s = summaries[c.slug];
                    return (
                      <CategoryCard
                        key={c.id}
                        name={c.name}
                        icon={c.icon}
                        color={c.color}
                        total={s?.total ?? 0}
                        optimal={s?.optimal ?? 0}
                        review={s?.suboptimal ?? 0}
                        onPress={() => router.push(`/biomarker/category/${c.slug}`)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DashCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-lg border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <LucideIcon name={icon} size={22} color={colors.gold} />
      <View className="ml-3 flex-1">
        <Text className="font-display" style={{ color: colors.white, fontSize: 16 }}>{title}</Text>
        <Text className="font-body" style={{ color: colors.textDim, fontSize: 12 }}>{subtitle}</Text>
      </View>
      <LucideIcon name="ChevronRight" size={20} color={colors.textDim} />
    </Pressable>
  );
}
