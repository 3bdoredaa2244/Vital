/**
 * RangeBar — horizontal 5-zone reference bar:
 *   low (red) · suboptimal (amber) · optimal (green) · suboptimal (amber) · high (red)
 * with the user's current value plotted as a marker. Two modes:
 *   - 'optimal': emphasises VITAL's functional optimal window
 *   - 'normal':  emphasises the standard lab normal window
 */
import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { colors } from '@/constants/theme';
import { formatNumber } from '@/lib/format';

interface RangeFields {
  optimal_low: number;
  optimal_high: number;
  normal_low: number;
  normal_high: number;
}

interface Props {
  range: RangeFields;
  value?: number | null;
  unit: string;
  mode?: 'optimal' | 'normal';
  /** Bar only — hides the threshold labels (for dense list rows). */
  compact?: boolean;
}

export function RangeBar({ range, value, unit, mode = 'optimal', compact = false }: Props) {
  const [width, setWidth] = useState(0);
  const { optimal_low, optimal_high, normal_low, normal_high } = range;

  const span = Math.max(normal_high - normal_low, 1e-6);
  const domainMin = normal_low - span * 0.25;
  const domainMax = normal_high + span * 0.25;
  const domain = Math.max(domainMax - domainMin, 1e-6);

  const pct = (x: number) => Math.max(0, Math.min(1, (x - domainMin) / domain));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Zone segments as [start%, end%, color].
  const zones: Array<[number, number, string]> = [
    [pct(domainMin), pct(normal_low), colors.red],
    [pct(normal_low), pct(optimal_low), colors.gold],
    [pct(optimal_low), pct(optimal_high), colors.green],
    [pct(optimal_high), pct(normal_high), colors.gold],
    [pct(normal_high), pct(domainMax), colors.red],
  ];

  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  const markerPct = hasValue ? pct(value as number) : null;

  const emphasised = mode === 'optimal' ? [optimal_low, optimal_high] : [normal_low, normal_high];

  return (
    <View>
      <View
        onLayout={onLayout}
        className="relative overflow-hidden rounded-sm"
        style={{ height: 12, backgroundColor: colors.border }}
      >
        {zones.map(([start, end, color], i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${start * 100}%`,
              width: `${Math.max(end - start, 0) * 100}%`,
              height: '100%',
              backgroundColor: color,
              opacity: mode === 'optimal' && i === 2 ? 1 : 0.85,
            }}
          />
        ))}

        {markerPct !== null && width > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: markerPct * width - 7,
              top: -3,
            }}
          >
            <View
              style={{
                width: 14,
                height: 18,
                borderRadius: 3,
                backgroundColor: colors.white,
                borderWidth: 2,
                borderColor: colors.obsidian,
              }}
            />
          </View>
        ) : null}
      </View>

      {/* Threshold labels */}
      {compact ? null : (
      <View className="mt-2 flex-row justify-between">
        <Text className="font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
          {formatNumber(emphasised[0]!)}
        </Text>
        <Text className="font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
          {mode === 'optimal' ? 'Optimal' : 'Normal'} ({unit})
        </Text>
        <Text className="font-mono" style={{ color: colors.textDim, fontSize: 10 }}>
          {formatNumber(emphasised[1]!)}
        </Text>
      </View>
      )}
    </View>
  );
}
