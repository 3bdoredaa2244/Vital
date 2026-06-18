/**
 * Labs Summary — the biomarker panel. A radial status dial + breakdown of the
 * user's markers, a data-derived insight, search + filter, a status-grouped
 * marker list with mini range bars, and the contributing tests (history).
 * Gated behind an active subscription.
 */
import { type BiomarkerStatus, STATUS_LABELS, type UserBiomarkerResult } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterPills, type PillOption } from '@/components/biomarker/FilterPills';
import { StatusDial } from '@/components/biomarker/StatusDial';
import {
  EmptyState,
  LucideIcon,
  RangeBar,
  SectionHeader,
  SkeletonList,
} from '@/components/ui';
import { colors, statusColors } from '@/constants/theme';
import { formatNumber } from '@/lib/format';
import { filterBiomarkers, sortBiomarkers } from '@/lib/library-select';
import { resultApi } from '@/lib/api';
import { useBiomarkerStore, type SortKey, type StatusFilter } from '@/lib/store/biomarkers';
import { useLibraryStore } from '@/lib/store/library';
import { useSubscriptionStore } from '@/lib/store/subscription';
import type { BiomarkerWithResult } from '@vital/shared';

const STATUS_OPTIONS: PillOption[] = [
  { value: 'all', label: 'All' },
  { value: 'optimal', label: 'Optimal', color: colors.green },
  { value: 'suboptimal', label: 'Review', color: colors.gold },
  { value: 'alert', label: 'Alert', color: colors.red },
  { value: 'untested', label: 'Untested', color: colors.textMuted },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'last_tested', label: 'Last tested' },
];

// Section titles for the grouped list (alert reads as "Out of Range").
const GROUP_TITLE: Record<BiomarkerStatus, string> = {
  alert: 'Out of Range',
  suboptimal: 'Review',
  optimal: 'Optimal',
  untested: 'Untested',
};
const GROUP_ORDER: BiomarkerStatus[] = ['alert', 'suboptimal', 'optimal', 'untested'];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BiomarkersTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasActive = useSubscriptionStore((s) => s.hasActive);
  const subLoaded = useSubscriptionStore((s) => s.loaded);

  const { biomarkers, categories, loaded, loading, error, fetch } = useLibraryStore();
  const ui = useBiomarkerStore();
  const [sortOpen, setSortOpen] = useState(false);
  const [results, setResults] = useState<UserBiomarkerResult[]>([]);

  useEffect(() => {
    if (!hasActive()) return;
    void fetch();
    resultApi
      .all()
      .then((r) => setResults(r.results))
      .catch(() => {});
  }, [hasActive, fetch]);

  // Status counts across the whole panel.
  const counts = useMemo(() => {
    const c = { optimal: 0, suboptimal: 0, alert: 0, untested: 0 };
    for (const b of biomarkers) c[b.status] += 1;
    return c;
  }, [biomarkers]);
  const tested = counts.optimal + counts.suboptimal + counts.alert;
  const total = biomarkers.length;

  // Insight: the category with the most out-of-range markers.
  const insight = useMemo(() => {
    if (counts.alert === 0) return null;
    const byCat = new Map<string, number>();
    for (const b of biomarkers) {
      if (b.status === 'alert') byCat.set(b.category_id, (byCat.get(b.category_id) ?? 0) + 1);
    }
    let topId: string | null = null;
    let topN = 0;
    byCat.forEach((nn, id) => {
      if (nn > topN) {
        topN = nn;
        topId = id;
      }
    });
    const cat = categories.find((c) => c.id === topId);
    return cat ? { cat, n: topN } : null;
  }, [biomarkers, categories, counts.alert]);

  // Filtered + sorted, then grouped by status.
  const groups = useMemo(() => {
    const filtered = sortBiomarkers(
      filterBiomarkers(biomarkers, { category: 'all', status: ui.status, search: ui.search }),
      ui.sort,
    );
    return GROUP_ORDER.map((status) => ({
      status,
      items: filtered.filter((b) => b.status === status),
    })).filter((g) => g.items.length > 0);
  }, [biomarkers, ui.status, ui.search, ui.sort]);

  // Contributing tests — results grouped by test date.
  const tests = useMemo(() => {
    const byDate = new Map<string, { date: string; count: number; lab: string | null }>();
    for (const r of results) {
      const g = byDate.get(r.tested_at) ?? { date: r.tested_at, count: 0, lab: r.lab_name };
      g.count += 1;
      if (!g.lab && r.lab_name) g.lab = r.lab_name;
      byDate.set(r.tested_at, g);
    }
    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [results]);
  const latest = tests[0];

  // ── Subscription gate ──
  if (subLoaded && !hasActive()) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top }}>
        <EmptyState
          icon="Lock"
          title="Unlock your biomarkers"
          message="An active VITAL subscription gives you access to 80+ biomarkers, optimal ranges, and longitudinal tracking."
          ctaLabel="View Plans"
          onCta={() => router.push('/subscription/plans')}
        />
      </View>
    );
  }

  const toggleStatus = (s: StatusFilter) => ui.setStatus(ui.status === s ? 'all' : s);

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-5">
          <Text className="font-display" style={{ color: colors.white, fontSize: 32 }}>
            Labs Summary
          </Text>
          <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 14, lineHeight: 20 }}>
            {latest
              ? `${latest.count} biomarkers updated from your test on ${fmtDate(latest.date)}.`
              : 'Your biomarker panel — results appear here after your first test.'}
          </Text>
        </View>

        {loading && !loaded ? (
          <View className="mt-6 px-5">
            <SkeletonList count={6} />
          </View>
        ) : error ? (
          <View className="mt-6 px-5">
            <EmptyState
              icon="TriangleAlert"
              title="Couldn't load biomarkers"
              message={error}
              ctaLabel="Retry"
              onCta={() => fetch(true)}
            />
          </View>
        ) : (
          <>
            {/* Dial hero */}
            <View className="mt-4 items-center">
              <StatusDial
                counts={counts}
                size={224}
                centerValue={tested}
                centerLabel="Biomarkers"
              />
              <Text className="mt-2 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                {total > tested ? `${tested} of ${total} markers tested` : `${tested} markers tracked`}
              </Text>
            </View>

            {/* Breakdown cards */}
            <View className="mt-5 flex-row px-5" style={{ gap: 10 }}>
              {(['optimal', 'suboptimal', 'alert'] as BiomarkerStatus[]).map((st) => {
                const active = ui.status === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => toggleStatus(st)}
                    className="flex-1 rounded-lg p-3"
                    style={{
                      backgroundColor: active ? `${statusColors[st]}1A` : colors.surface,
                      borderColor: active ? statusColors[st] : colors.border,
                      borderWidth: active ? 2 : 1,
                    }}
                  >
                    <Text className="font-display" style={{ color: statusColors[st], fontSize: 26 }}>
                      {counts[st]}
                    </Text>
                    <View className="mt-1 flex-row items-center" style={{ gap: 5 }}>
                      <View
                        className="rounded-full"
                        style={{ width: 6, height: 6, backgroundColor: statusColors[st] }}
                      />
                      <Text className="font-body" style={{ color: colors.textDim, fontSize: 12 }}>
                        {st === 'alert' ? 'Out of Range' : STATUS_LABELS[st]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Insight callout — always tappable; opens the AI chat seeded with
                a relevant question grounded in the user's labs. */}
            {insight ? (
              <Pressable
                onPress={() =>
                  router.push(
                    `/insights?ask=${encodeURIComponent(
                      `My ${insight.cat.name} panel has ${insight.n} ${insight.n === 1 ? 'marker' : 'markers'} out of range. Explain what they mean, why they matter, and what could help — based on my latest labs.`,
                    )}`,
                  )
                }
                className="mx-5 mt-5 rounded-xl border p-4"
                style={{ borderColor: colors.gold, backgroundColor: `${colors.gold}0D` }}
              >
                <Text className="font-body" style={{ color: colors.white, fontSize: 14, lineHeight: 20 }}>
                  <Text style={{ fontWeight: '700' }}>{insight.cat.name}</Text> has {insight.n}{' '}
                  {insight.n === 1 ? 'marker' : 'markers'} out of range — the top area to focus on
                  right now.
                </Text>
                <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
                  <Text className="font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 11 }}>
                    Explore your labs in detail
                  </Text>
                  <LucideIcon name="ArrowRight" size={14} color={colors.gold} />
                </View>
              </Pressable>
            ) : tested > 0 ? (
              <Pressable
                onPress={() =>
                  router.push(
                    `/insights?ask=${encodeURIComponent(
                      'Give me insights about my latest lab results — what stands out, what I am doing well, and how to keep improving.',
                    )}`,
                  )
                }
                className="mx-5 mt-5 rounded-xl border p-4"
                style={{ borderColor: `${colors.green}55`, backgroundColor: `${colors.green}14` }}
              >
                <View className="flex-row items-start" style={{ gap: 10 }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{ width: 20, height: 20, backgroundColor: colors.green, marginTop: 1 }}
                  >
                    <LucideIcon name="Check" size={12} color={colors.obsidian} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body" style={{ color: colors.greenInk, fontSize: 13, fontWeight: '600' }}>
                      Everything looks healthy
                    </Text>
                    <Text className="font-body" style={{ color: colors.green, fontSize: 12, lineHeight: 18, marginTop: 2 }}>
                      No markers out of range from your latest test.
                    </Text>
                  </View>
                </View>
                <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
                  <Text className="font-mono uppercase tracking-widest" style={{ color: colors.greenInk, fontSize: 11 }}>
                    Explore your labs in detail
                  </Text>
                  <LucideIcon name="ArrowRight" size={14} color={colors.greenInk} />
                </View>
              </Pressable>
            ) : null}

            {/* Search */}
            <View className="mt-5 px-5">
              <View
                className="flex-row items-center rounded-md border px-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <LucideIcon name="Search" size={16} color={colors.textDim} />
                <TextInput
                  value={ui.search}
                  onChangeText={ui.setSearch}
                  placeholder="Search for Vitamin D, Cortisol, etc."
                  placeholderTextColor={colors.textMuted}
                  className="ml-2 flex-1 py-3 font-body"
                  style={{ color: colors.white, fontSize: 14 }}
                />
                {ui.search ? (
                  <Pressable onPress={() => ui.setSearch('')} hitSlop={8}>
                    <LucideIcon name="X" size={16} color={colors.textDim} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Filter + sort */}
            <View className="mt-3 px-5">
              <FilterPills
                options={STATUS_OPTIONS}
                value={ui.status}
                onChange={(v) => ui.setStatus(v as StatusFilter)}
              />
            </View>
            <View className="mt-3 px-5">
              <Pressable
                className="flex-row items-center justify-between rounded-md border px-4 py-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                onPress={() => setSortOpen((o) => !o)}
              >
                <Text
                  className="font-mono uppercase tracking-widest"
                  style={{ color: colors.textDim, fontSize: 12 }}
                >
                  Filter & sort
                </Text>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text className="font-body" style={{ color: colors.text, fontSize: 13 }}>
                    {SORT_OPTIONS.find((s) => s.value === ui.sort)?.label ?? 'Name'}
                  </Text>
                  <LucideIcon name={sortOpen ? 'ChevronUp' : 'ChevronDown'} size={16} color={colors.textDim} />
                </View>
              </Pressable>
              {sortOpen ? (
                <View
                  className="mt-2 rounded-md border"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      className="flex-row items-center justify-between px-4 py-3"
                      onPress={() => {
                        ui.setSort(opt.value);
                        setSortOpen(false);
                      }}
                    >
                      <Text className="font-body" style={{ color: colors.text, fontSize: 14 }}>
                        {opt.label}
                      </Text>
                      {ui.sort === opt.value ? (
                        <LucideIcon name="Check" size={16} color={colors.gold} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Grouped marker list */}
            <View className="mt-5 px-5">
              {groups.length === 0 ? (
                <EmptyState
                  icon="SearchX"
                  title="No biomarkers found"
                  message="Try clearing your search or filters."
                />
              ) : (
                groups.map((g) => (
                  <View key={g.status} className="mb-5">
                    <View className="mb-1 flex-row items-center justify-between">
                      <View className="flex-row items-center" style={{ gap: 8 }}>
                        <View
                          className="rounded-full"
                          style={{ width: 8, height: 8, backgroundColor: statusColors[g.status] }}
                        />
                        <Text className="font-display" style={{ color: colors.white, fontSize: 18 }}>
                          {GROUP_TITLE[g.status]}
                        </Text>
                      </View>
                      <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                        {g.items.length} {g.items.length === 1 ? 'biomarker' : 'biomarkers'}
                      </Text>
                    </View>
                    {g.items.map((b) => (
                      <BiomarkerRangeRow
                        key={b.id}
                        biomarker={b}
                        onPress={() => router.push(`/biomarker/${b.id}`)}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>

            {/* Contributing tests / history */}
            {tests.length > 0 ? (
              <View className="mt-1 px-5">
                <SectionHeader title="Test history" />
                <View
                  className="mt-2 overflow-hidden rounded-lg border"
                  style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                >
                  {tests.map((t, i) => (
                    <View
                      key={t.date}
                      className="flex-row items-center justify-between px-4 py-3"
                      style={
                        i < tests.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: colors.border }
                          : undefined
                      }
                    >
                      <View className="flex-row items-center" style={{ gap: 10 }}>
                        <LucideIcon name="FileText" size={18} color={colors.textDim} />
                        <View>
                          <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>
                            {fmtDate(t.date)}
                          </Text>
                          <Text className="font-body" style={{ color: colors.textDim, fontSize: 12 }}>
                            {t.count} {t.count === 1 ? 'marker' : 'markers'}
                            {t.lab ? ` · ${t.lab}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** A list row: status dot, name + compact range bar, and a status-coloured value. */
function BiomarkerRangeRow({
  biomarker: b,
  onPress,
}: {
  biomarker: BiomarkerWithResult;
  onPress: () => void;
}) {
  const value = b.latest_result?.value ?? null;
  const hasValue = value !== null && value !== undefined;
  const color = statusColors[b.status];
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b py-2.5"
      style={{ borderBottomColor: colors.border, gap: 10 }}
    >
      <View
        className="rounded-full"
        style={{ width: 7, height: 7, backgroundColor: color, alignSelf: 'flex-start', marginTop: hasValue ? 5 : 1 }}
      />
      <View className="flex-1">
        <Text className="font-body" style={{ color: colors.white, fontSize: 14 }} numberOfLines={1}>
          {b.name}
        </Text>
        {hasValue ? (
          <RangeBar range={b} value={value} unit={b.unit} mode="optimal" compact />
        ) : (
          <Text className="font-body" style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            Not tested yet
          </Text>
        )}
      </View>
      {hasValue ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text className="font-display" style={{ color, fontSize: 17 }}>
            {formatNumber(value)}
          </Text>
          <Text className="font-body" style={{ color: colors.textMuted, fontSize: 10 }}>
            {b.unit}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
