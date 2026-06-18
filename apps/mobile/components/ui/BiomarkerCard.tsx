/**
 * BiomarkerCard — used in the library grid/list. Shows name, category color dot,
 * unit, latest result (if any), and a status indicator.
 */
import type { BiomarkerStatus, BiomarkerWithResult } from '@vital/shared';
import { Pressable, Text, View } from 'react-native';

import { colors, statusColors } from '@/constants/theme';
import { formatDate, formatNumber } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  biomarker: BiomarkerWithResult;
  onPress: () => void;
  view?: 'grid' | 'list';
  /** Optional search term to highlight in the name. */
  highlight?: string;
}

function categoryColor(biomarker: BiomarkerWithResult): string {
  if (biomarker.category?.color) return biomarker.category.color;
  // Fall back to the canonical dataset color via slug if present on tags.
  return colors.gold;
}

function HighlightedName({ name, term }: { name: string; term?: string }) {
  if (!term) {
    return (
      <Text className="font-display" style={{ color: colors.white, fontSize: 18 }}>
        {name}
      </Text>
    );
  }
  const idx = name.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) {
    return (
      <Text className="font-display" style={{ color: colors.white, fontSize: 18 }}>
        {name}
      </Text>
    );
  }
  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + term.length);
  const after = name.slice(idx + term.length);
  return (
    <Text className="font-display" style={{ color: colors.white, fontSize: 18 }}>
      {before}
      <Text style={{ color: colors.gold }}>{match}</Text>
      {after}
    </Text>
  );
}

export function BiomarkerCard({ biomarker, onPress, view = 'list', highlight }: Props) {
  const status: BiomarkerStatus = biomarker.status;
  const dotColor = categoryColor(biomarker);
  const result = biomarker.latest_result;

  if (view === 'grid') {
    return (
      <Pressable
        onPress={onPress}
        className="m-1 flex-1 rounded-lg border p-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border, minHeight: 120 }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: dotColor }} />
          <View
            className="rounded-full"
            style={{ width: 8, height: 8, backgroundColor: statusColors[status] }}
          />
        </View>
        <HighlightedName name={biomarker.name} term={highlight} />
        <View className="mt-auto pt-2">
          {result ? (
            <Text className="font-display" style={{ color: colors.text, fontSize: 22 }}>
              {formatNumber(result.value)}
              <Text className="font-mono" style={{ color: colors.textDim, fontSize: 11 }}>
                {' '}
                {biomarker.unit}
              </Text>
            </Text>
          ) : (
            <Text className="font-mono" style={{ color: colors.textMuted, fontSize: 11 }}>
              Untested · {biomarker.unit}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center rounded-lg border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View
        className="mr-3 rounded-full"
        style={{ width: 10, height: 10, backgroundColor: dotColor }}
      />
      <View className="flex-1">
        <HighlightedName name={biomarker.name} term={highlight} />
        <Text className="mt-0.5 font-mono" style={{ color: colors.textDim, fontSize: 11 }}>
          {result
            ? `${formatNumber(result.value)} ${biomarker.unit} · ${formatDate(result.tested_at)}`
            : `${biomarker.unit} · not tested`}
        </Text>
      </View>
      <StatusBadge status={status} size="sm" />
    </Pressable>
  );
}
