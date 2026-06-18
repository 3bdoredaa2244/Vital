/**
 * Recommendations — personalized supplement / nutrition / lifestyle / retest
 * guidance derived from the user's out-of-range biomarkers (rules-based).
 */
import type { RecommendedIntervention } from '@vital/shared';
import { STATUS_COLORS, STATUS_LABELS } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, LucideIcon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { recommendationApi } from '@/lib/api';

const CATEGORY_ICON: Record<string, string> = {
  supplement: 'Pill',
  nutrition: 'Apple',
  lifestyle: 'Activity',
  retest: 'RefreshCw',
};

export default function Recommendations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recs, setRecs] = useState<RecommendedIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationApi
      .me()
      .then((r) => setRecs(r.recommendations))
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
          Recommendations
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : recs.length === 0 ? (
        <View className="flex-1 px-5">
          <EmptyState
            icon="Sparkles"
            title="Nothing flagged"
            message="When a marker falls outside its optimal range, tailored guidance will appear here."
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          {recs.map(({ intervention: iv, matched }) => (
            <View
              key={iv.id}
              className="mb-3 rounded-lg border p-4"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <LucideIcon name={CATEGORY_ICON[iv.category] ?? 'Sparkles'} size={18} color={colors.gold} />
                <Text className="flex-1 font-display" style={{ color: colors.white, fontSize: 17 }}>{iv.name}</Text>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${colors.gold}1A` }}>
                  <Text className="font-mono uppercase" style={{ color: colors.gold, fontSize: 9 }}>{iv.evidence_level}</Text>
                </View>
              </View>

              {iv.summary ? (
                <Text className="mt-2 font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{iv.summary}</Text>
              ) : null}
              {iv.detail ? (
                <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 13, lineHeight: 19 }}>{iv.detail}</Text>
              ) : null}
              {iv.dosage ? (
                <Text className="mt-2 font-mono" style={{ color: colors.textDim, fontSize: 12 }}>{iv.dosage}</Text>
              ) : null}

              {/* Matched markers */}
              <View className="mt-3 flex-row flex-wrap" style={{ gap: 6 }}>
                {matched.map((m) => (
                  <View
                    key={m.slug}
                    className="flex-row items-center rounded-full px-2 py-1"
                    style={{ gap: 4, backgroundColor: `${STATUS_COLORS[m.status]}1A` }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COLORS[m.status] }} />
                    <Text className="font-body" style={{ color: colors.text, fontSize: 11 }}>
                      {m.name} · {STATUS_LABELS[m.status]}
                    </Text>
                  </View>
                ))}
              </View>

              {iv.url ? (
                <View className="mt-3">
                  <Button label="Learn more" variant="secondary" onPress={() => Linking.openURL(iv.url).catch(() => {})} />
                </View>
              ) : null}
            </View>
          ))}

          <Text className="mt-4 text-center font-body" style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
            General wellness guidance, not medical advice. Consult a clinician before changing
            supplements or treatment.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
