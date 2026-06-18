/**
 * Category Detail — header with name/description/icon, a progress ring for the
 * share of optimal markers, the category's biomarker list, an educational blurb,
 * and a related-categories row.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BiomarkerCard,
  EmptyState,
  LucideIcon,
  ProgressRing,
  SectionHeader,
  SkeletonList,
} from '@/components/ui';
import { colors } from '@/constants/theme';
import { summariseByCategory } from '@/lib/library-select';
import { useLibraryStore } from '@/lib/store/library';

export default function CategoryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { biomarkers, categories, loaded, loading, fetch } = useLibraryStore();

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const category = categories.find((c) => c.slug === slug);
  const inCategory = useMemo(
    () => biomarkers.filter((b) => b.category?.slug === slug),
    [biomarkers, slug],
  );
  const summary = summariseByCategory(inCategory)[slug ?? ''];

  const tested = inCategory.filter((b) => b.status !== 'untested').length;
  const optimal = summary?.optimal ?? 0;
  const ratio = tested > 0 ? optimal / tested : 0;

  const related = categories.filter((c) => c.slug !== slug).slice(0, 6);

  if (loading && !loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <SkeletonList count={6} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top }}>
        <EmptyState icon="SearchX" title="Category not found" ctaLabel="Go back" onCta={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable className="px-5 py-2" onPress={() => router.back()} hitSlop={8}>
          <LucideIcon name="ArrowLeft" size={22} color={colors.white} />
        </Pressable>

        {/* Header */}
        <View className="flex-row items-center px-5">
          <View
            className="mr-4 items-center justify-center rounded-lg"
            style={{ width: 52, height: 52, backgroundColor: `${category.color}1F` }}
          >
            <LucideIcon name={category.icon} size={26} color={category.color} />
          </View>
          <View className="flex-1">
            <Text className="font-display" style={{ color: colors.white, fontSize: 28 }}>
              {category.name}
            </Text>
            <Text className="font-mono" style={{ color: colors.textDim, fontSize: 11 }}>
              {inCategory.length} markers
            </Text>
          </View>
        </View>

        {/* Progress + description */}
        <View className="mt-5 px-5">
          <View
            className="flex-row items-center rounded-lg border p-5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <ProgressRing progress={ratio} size={92} color={category.color} sublabel="optimal" />
            <Text className="ml-5 flex-1 font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {category.description}
            </Text>
          </View>
        </View>

        {/* Biomarker list */}
        <View className="mt-7 px-5">
          <SectionHeader title="Markers" />
          {inCategory.length === 0 ? (
            <EmptyState icon="FlaskConical" title="No markers here yet" />
          ) : (
            inCategory.map((b) => (
              <BiomarkerCard key={b.id} biomarker={b} onPress={() => router.push(`/biomarker/${b.id}`)} />
            ))
          )}
        </View>

        {/* Educational blurb */}
        <View className="mt-4 px-5">
          <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="mb-1 font-mono uppercase tracking-wider" style={{ color: category.color, fontSize: 11 }}>
              Why this category matters
            </Text>
            <Text className="font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {category.description} Tracking these markers together gives a fuller picture than any
              single value in isolation.
            </Text>
          </View>
        </View>

        {/* Related categories */}
        {related.length > 0 ? (
          <View className="mt-7">
            <View className="px-5">
              <SectionHeader title="Other categories" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {related.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/biomarker/category/${c.slug}`)}
                  className="flex-row items-center rounded-full border px-4 py-2.5"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <View className="mr-2 rounded-full" style={{ width: 8, height: 8, backgroundColor: c.color }} />
                  <Text className="font-mono" style={{ color: colors.text, fontSize: 12 }}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
