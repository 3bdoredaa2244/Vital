/**
 * Add-ons — pick extra blood markers to test on top of your plan. Selection is
 * held in the add-on store; the running total (with 14% VAT) is charged at
 * checkout when the booking is confirmed. Markers are grouped by category.
 */
import type { AddonMarker } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LucideIcon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { addonApi } from '@/lib/api';
import { useAddonStore } from '@/lib/store/addons';

const VAT_RATE = 0.14;
const egp = (n: number) => `EGP ${n.toLocaleString('en-US')}`;

export default function Addons() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [markers, setMarkers] = useState<AddonMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = useAddonStore((s) => s.selected);
  const toggle = useAddonStore((s) => s.toggle);

  useEffect(() => {
    addonApi
      .list()
      .then((r) => setMarkers(r.addons))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group markers by category, preserving the server's ordering.
  const groups = useMemo(() => {
    const byCat = new Map<string, AddonMarker[]>();
    for (const m of markers) {
      const list = byCat.get(m.category_name) ?? [];
      list.push(m);
      byCat.set(m.category_name, list);
    }
    return [...byCat.entries()];
  }, [markers]);

  const subtotal = markers
    .filter((m) => selected.includes(m.id))
    .reduce((sum, m) => sum + m.price_egp, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-4 pb-3" style={{ gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <LucideIcon name="ChevronLeft" size={24} color={colors.white} />
        </Pressable>
        <Text className="font-display" style={{ color: colors.white, fontSize: 22 }}>
          Extra tests
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : markers.length === 0 ? (
        <View className="flex-1 px-5">
          <EmptyState
            icon="FlaskConical"
            title="No add-ons available"
            message="There are no extra markers to purchase right now."
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 200 }}>
            <Text className="mb-4 font-body" style={{ color: colors.textDim, fontSize: 13, lineHeight: 19 }}>
              Add markers that aren’t in your plan. You’ll pay for these at checkout when you
              confirm your booking.
            </Text>
            {groups.map(([category, items]) => (
              <View key={category} className="mb-5">
                <Text className="mb-2 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 11 }}>
                  {category}
                </Text>
                {items.map((m) => {
                  const on = selected.includes(m.id);
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => toggle(m.id)}
                      className="mb-2 flex-row items-center rounded-lg border p-4"
                      style={{
                        backgroundColor: on ? colors.deep : colors.surface,
                        borderColor: on ? colors.gold : colors.border,
                      }}
                    >
                      <LucideIcon
                        name={on ? 'CheckSquare' : 'Square'}
                        size={20}
                        color={on ? colors.gold : colors.textMuted}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="font-body" style={{ color: colors.white, fontSize: 15 }}>{m.name}</Text>
                        <Text className="font-mono" style={{ color: colors.textMuted, fontSize: 11 }}>{m.unit}</Text>
                      </View>
                      <Text className="font-display" style={{ color: colors.white, fontSize: 15 }}>
                        {egp(m.price_egp)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Sticky total + done */}
          <View
            className="absolute inset-x-0 bottom-0 border-t px-5 pt-4"
            style={{ backgroundColor: colors.obsidian, borderColor: colors.border, paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                {selected.length} selected · VAT {egp(vat)}
              </Text>
              <Text className="font-display" style={{ color: colors.white, fontSize: 20 }}>{egp(total)}</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="mt-3 items-center rounded-lg py-4"
              style={{ backgroundColor: colors.gold }}
            >
              <Text className="font-display" style={{ color: colors.obsidian, fontSize: 16 }}>
                {selected.length > 0 ? 'Done' : 'Skip extras'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
