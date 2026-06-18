/**
 * Notifications — the user's alert feed (out-of-range alerts, retest reminders,
 * score-drop warnings, announcements). Mark-all-read on open.
 */
import type { AppNotification, NotificationSeverity } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LucideIcon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { notificationApi } from '@/lib/api';

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: colors.cyan,
  warning: colors.gold,
  critical: colors.red,
};

const TYPE_ICON: Record<string, string> = {
  alert: 'TriangleAlert',
  retest: 'CalendarClock',
  score: 'TrendingDown',
  insight: 'Sparkles',
  booking: 'CalendarCheck',
  visit: 'Navigation',
  results: 'FlaskConical',
  announcement: 'Megaphone',
  system: 'Bell',
};

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi
      .feed()
      .then((r) => {
        setItems(r.notifications);
        if (r.unread_count > 0) void notificationApi.markRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-4 pb-3" style={{ gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <LucideIcon name="ChevronLeft" size={24} color={colors.white} />
        </Pressable>
        <Text className="font-display" style={{ color: colors.white, fontSize: 22 }}>
          Notifications
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 px-5">
          <EmptyState icon="Bell" title="All clear" message="You're up to date — no alerts right now." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          {items.map((n) => {
            const color = SEVERITY_COLOR[n.severity];
            const card = (
              <View
                className="mb-2 flex-row rounded-lg border p-4"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, opacity: n.read_at ? 0.7 : 1 }}
              >
                <LucideIcon name={TYPE_ICON[n.type] ?? 'Bell'} size={20} color={color} />
                <View className="ml-3 flex-1">
                  <Text className="font-display" style={{ color: colors.white, fontSize: 15 }}>{n.title}</Text>
                  <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 13, lineHeight: 19 }}>{n.body}</Text>
                  <Text className="mt-1 font-mono" style={{ color: colors.textMuted, fontSize: 10 }}>
                    {new Date(n.created_at).toLocaleDateString('en-GB')}
                  </Text>
                </View>
              </View>
            );
            return n.link ? (
              <Pressable key={n.id} onPress={() => router.push(`/${n.link}` as never)}>{card}</Pressable>
            ) : (
              <View key={n.id}>{card}</View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
