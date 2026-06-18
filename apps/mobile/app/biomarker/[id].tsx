/**
 * Biomarker Detail — long-form page: header, dual-mode range bar, history chart,
 * explanatory sections, related biomarkers, and a sticky action bar with manual
 * result entry.
 */
import type { AppContent, BiomarkerWithResult, UserBiomarkerResult } from '@vital/shared';
import { DEFAULT_APP_CONTENT, STATUS_LABELS } from '@vital/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualResultSheet } from '@/components/biomarker/ManualResultSheet';
import {
  Button,
  EmptyState,
  HistoryChart,
  LucideIcon,
  RangeBar,
  SectionHeader,
  Skeleton,
  StatusBadge,
} from '@/components/ui';
import { colors, statusColors } from '@/constants/theme';
import { ApiError, biomarkerApi, contentApi, resultApi } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { useLibraryStore } from '@/lib/store/library';
import { toast } from '@/components/ui';

function Bullet({ children }: { children: string }) {
  return (
    <View className="mb-2 flex-row">
      <View
        className="mr-3 mt-2 rounded-full"
        style={{ width: 5, height: 5, backgroundColor: colors.gold }}
      />
      <Text className="flex-1 font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
        {children}
      </Text>
    </View>
  );
}

export default function BiomarkerDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [biomarker, setBiomarker] = useState<BiomarkerWithResult | null>(null);
  const [history, setHistory] = useState<UserBiomarkerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeMode, setRangeMode] = useState<'optimal' | 'normal'>('optimal');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appContent, setAppContent] = useState<AppContent>(DEFAULT_APP_CONTENT);

  useEffect(() => {
    contentApi.get().then((r) => setAppContent(r.content)).catch(() => {});
  }, []);

  const allBiomarkers = useLibraryStore((s) => s.biomarkers);
  const refreshLibrary = useLibraryStore((s) => s.fetch);

  const load = async () => {
    if (!id) return;
    try {
      const [{ biomarker: bm }, { results }] = await Promise.all([
        biomarkerApi.get(id),
        resultApi.forBiomarker(id),
      ]);
      setBiomarker(bm);
      setHistory(results);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load biomarker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSaved = async () => {
    setLoading(true);
    await load();
    await refreshLibrary(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <Skeleton width="50%" height={28} />
        <View style={{ height: 16 }} />
        <Skeleton width="35%" height={48} />
        <View style={{ height: 24 }} />
        <Skeleton height={120} />
      </View>
    );
  }

  if (!biomarker) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top }}>
        <EmptyState icon="SearchX" title="Biomarker not found" ctaLabel="Go back" onCta={() => router.back()} />
      </View>
    );
  }

  const result = biomarker.latest_result;
  // Most recent imported result that carried the lab's printed reference range.
  const labRange = history.find((h) => h.reference_range)?.reference_range ?? null;
  const accent = biomarker.category?.color ?? colors.gold;
  const related = allBiomarkers
    .filter((b) => b.category?.slug === biomarker.category?.slug && b.id !== biomarker.id)
    .slice(0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable className="px-5 py-2" onPress={() => router.back()} hitSlop={8}>
          <LucideIcon name="ArrowLeft" size={22} color={colors.white} />
        </Pressable>

        {/* Section 1: Header */}
        <View className="px-5">
          <View className="flex-row items-center">
            <View className="rounded-sm px-2 py-1" style={{ backgroundColor: `${accent}26` }}>
              <Text className="font-mono uppercase" style={{ color: accent, fontSize: 10 }}>
                {biomarker.category?.name ?? 'Biomarker'}
              </Text>
            </View>
          </View>
          <Text className="mt-2 font-display" style={{ color: colors.white, fontSize: 38, lineHeight: 42 }}>
            {biomarker.name}
          </Text>

          <View className="mt-3 flex-row items-end justify-between">
            <View>
              {result ? (
                <Text className="font-display" style={{ color: colors.white, fontSize: 44 }}>
                  {formatNumber(result.value)}
                  <Text className="font-mono" style={{ color: colors.textDim, fontSize: 16 }}>
                    {' '}
                    {biomarker.unit}
                  </Text>
                </Text>
              ) : (
                <Text className="font-display" style={{ color: colors.textDim, fontSize: 28 }}>
                  No result yet
                </Text>
              )}
              {result ? (
                <Text className="mt-1 font-mono" style={{ color: colors.textMuted, fontSize: 11 }}>
                  Last tested {formatDate(result.tested_at)}
                </Text>
              ) : null}
              {labRange ? (
                <Text className="mt-0.5 font-mono" style={{ color: colors.textMuted, fontSize: 11 }}>
                  Lab range {labRange}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={biomarker.status} />
          </View>
        </View>

        {/* Section 2: Range visualization */}
        <View className="mt-7 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <SectionHeader title="Range" />
            <View className="flex-row rounded-md border p-1" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {(['normal', 'optimal'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setRangeMode(mode)}
                  className="rounded-sm px-3 py-1"
                  style={{ backgroundColor: rangeMode === mode ? colors.borderLight : 'transparent' }}
                >
                  <Text
                    className="font-mono"
                    style={{ color: rangeMode === mode ? colors.white : colors.textDim, fontSize: 10 }}
                  >
                    {mode === 'normal' ? 'Lab Normal' : 'Optimal'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <RangeBar
              range={biomarker}
              value={result?.value ?? null}
              unit={biomarker.unit}
              mode={rangeMode}
            />
            {result ? (
              <Text className="mt-3 font-body" style={{ color: statusColors[biomarker.status], fontSize: 13 }}>
                Your value is {STATUS_LABELS[biomarker.status].toLowerCase()}.
              </Text>
            ) : null}
          </View>
        </View>

        {/* Section 3: History chart */}
        <View className="mt-7 px-5">
          <SectionHeader title="History" />
          <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <HistoryChart
              results={history}
              optimalLow={biomarker.optimal_low}
              optimalHigh={biomarker.optimal_high}
              unit={biomarker.unit}
            />
          </View>
        </View>

        {/* Section 4: What this measures */}
        {biomarker.description ? (
          <View className="mt-7 px-5">
            <SectionHeader title="What this measures" />
            <Text className="font-body" style={{ color: colors.text, fontSize: 15, lineHeight: 23 }}>
              {biomarker.description}
            </Text>
          </View>
        ) : null}

        {/* Section 5: Why it matters */}
        {biomarker.why_it_matters ? (
          <View className="mt-7 px-5">
            <SectionHeader title="Why it matters" />
            {biomarker.why_it_matters
              .split(/(?<=[.!?])\s+/)
              .filter(Boolean)
              .map((sentence, i) => (
                <Bullet key={i}>{sentence}</Bullet>
              ))}
          </View>
        ) : null}

        {/* Section 6: What affects this */}
        {biomarker.what_affects_it ? (
          <View className="mt-7 px-5">
            <SectionHeader title="What affects this marker" />
            <Text className="font-body" style={{ color: colors.text, fontSize: 15, lineHeight: 23 }}>
              {biomarker.what_affects_it}
            </Text>
          </View>
        ) : null}

        {/* Section 7: Related biomarkers */}
        {related.length > 0 ? (
          <View className="mt-7">
            <View className="px-5">
              <SectionHeader title="Related biomarkers" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {related.map((rb) => (
                <Pressable
                  key={rb.id}
                  onPress={() => router.push(`/biomarker/${rb.id}`)}
                  className="rounded-lg border p-3"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, width: 140 }}
                >
                  <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: rb.category?.color ?? colors.gold }} />
                  <Text className="mt-2 font-display" style={{ color: colors.white, fontSize: 15 }} numberOfLines={2}>
                    {rb.name}
                  </Text>
                  <Text className="mt-1 font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
                    {rb.latest_result ? `${formatNumber(rb.latest_result.value)} ${rb.unit}` : rb.unit}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* Section 8: Sticky action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row border-t px-5 pt-3"
        style={{ backgroundColor: colors.deep, borderColor: colors.border, paddingBottom: insets.bottom + 12, gap: 10 }}
      >
        <View className="flex-1">
          <Button
            label="Book a Test"
            variant="secondary"
            icon="Calendar"
            onPress={() => {
              const url = appContent.lab_partner.url;
              if (url) Linking.openURL(url).catch(() => toast.info('Could not open booking page'));
              else toast.info(`Contact ${appContent.lab_partner.name || 'our lab partner'} to book`);
            }}
          />
        </View>
        <View className="flex-1">
          <Button label="Add Result" icon="Plus" onPress={() => setSheetOpen(true)} />
        </View>
      </View>

      <ManualResultSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        biomarker={biomarker}
        onSaved={onSaved}
      />
    </View>
  );
}
