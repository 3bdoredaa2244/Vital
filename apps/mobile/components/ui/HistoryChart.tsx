/**
 * HistoryChart — line chart of a biomarker's results over time, with a shaded
 * optimal band and tappable data points.
 *
 * NOTE: Implemented on react-native-svg for dependency-light reliability across
 * iOS/Android/web. (Victory Native XL is in the stack for richer Phase 2
 * visualisations; this wrapper keeps the same props contract.)
 */
import type { UserBiomarkerResult } from '@vital/shared';
import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line as SvgLine, Polyline, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';
import { formatDate, formatNumber } from '@/lib/format';

interface Props {
  results: UserBiomarkerResult[]; // ascending by tested_at
  optimalLow: number;
  optimalHigh: number;
  unit: string;
  height?: number;
}

const PADDING = { top: 16, right: 12, bottom: 28, left: 36 };

export function HistoryChart({ results, optimalLow, optimalHigh, unit, height = 200 }: Props) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { points, yMin, yMax } = useMemo(() => {
    const values = results.map((r) => r.value);
    const lo = Math.min(...values, optimalLow);
    const hi = Math.max(...values, optimalHigh);
    const pad = (hi - lo || 1) * 0.15;
    return { points: results, yMin: lo - pad, yMax: hi + pad };
  }, [results, optimalLow, optimalHigh]);

  if (results.length === 0) {
    return (
      <View
        className="items-center justify-center rounded-lg border"
        style={{ height, backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="font-body" style={{ color: colors.textDim }}>
          No results yet
        </Text>
      </View>
    );
  }

  const chartW = Math.max(width - PADDING.left - PADDING.right, 1);
  const chartH = height - PADDING.top - PADDING.bottom;
  const yRange = Math.max(yMax - yMin, 1e-6);

  const xFor = (i: number) =>
    PADDING.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
  const yFor = (v: number) => PADDING.top + chartH - ((v - yMin) / yRange) * chartH;

  const optimalTop = yFor(optimalHigh);
  const optimalBottom = yFor(optimalLow);

  const polyline = points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ');

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* Optimal band */}
          <Rect
            x={PADDING.left}
            y={Math.min(optimalTop, optimalBottom)}
            width={chartW}
            height={Math.abs(optimalBottom - optimalTop)}
            fill={colors.green}
            opacity={0.12}
          />
          <SvgLine
            x1={PADDING.left}
            y1={optimalTop}
            x2={width - PADDING.right}
            y2={optimalTop}
            stroke={colors.green}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <SvgLine
            x1={PADDING.left}
            y1={optimalBottom}
            x2={width - PADDING.right}
            y2={optimalBottom}
            stroke={colors.green}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />

          {/* Trend line (only if >1 point) */}
          {points.length > 1 ? (
            <Polyline points={polyline} fill="none" stroke={colors.gold} strokeWidth={2} />
          ) : null}

          {/* Data points */}
          {points.map((p, i) => (
            <Circle
              key={p.id}
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={selected === i ? 6 : 4}
              fill={colors.gold}
              stroke={colors.obsidian}
              strokeWidth={2}
              onPress={() => setSelected(selected === i ? null : i)}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}

      {/* Tooltip */}
      {selected !== null && points[selected] ? (
        <View
          className="mt-2 self-center rounded-md px-3 py-1.5"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="font-mono" style={{ color: colors.white, fontSize: 12 }}>
            {formatNumber(points[selected].value)} {unit} · {formatDate(points[selected].tested_at)}
          </Text>
        </View>
      ) : null}

      {points.length === 1 ? (
        <Text className="mt-2 text-center font-body" style={{ color: colors.textDim, fontSize: 12 }}>
          Test again to see your trend
        </Text>
      ) : null}
    </View>
  );
}
