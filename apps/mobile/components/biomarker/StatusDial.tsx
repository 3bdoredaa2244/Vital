/**
 * StatusDial — radial gauge of segmented arc wedges, one per biomarker, grouped
 * into arcs by status (alert → review → optimal → untested). The centre shows a
 * count (tested markers). Pure SVG, works on iOS/Android/web.
 */
import type { BiomarkerStatus } from '@vital/shared';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, statusColors } from '@/constants/theme';

interface Props {
  counts: { optimal: number; suboptimal: number; alert: number; untested: number };
  size?: number;
  centerValue: number | string;
  centerLabel?: string;
}

// Draw order around the ring (12 o'clock, clockwise).
const ORDER: BiomarkerStatus[] = ['alert', 'suboptimal', 'optimal', 'untested'];

export function StatusDial({ counts, size = 240, centerValue, centerLabel }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r2 = size / 2 - 9; // outer radius
  const r1 = r2 - size * 0.085; // inner radius (ring thickness)

  const total = ORDER.reduce((s, k) => s + counts[k], 0);
  const n = Math.max(total, 1);
  const step = 360 / n;
  const gap = step * 0.16; // small gap between wedges

  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, d: number) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
  const arc = (s: number, e: number) => {
    const [ax, ay] = pt(r1, s);
    const [bx, by] = pt(r2, s);
    const [dcx, dcy] = pt(r2, e);
    const [ex, ey] = pt(r1, e);
    const lg = e - s > 180 ? 1 : 0;
    return `M${ax},${ay}L${bx},${by}A${r2},${r2},0,${lg},1,${dcx},${dcy}L${ex},${ey}A${r1},${r1},0,${lg},0,${ax},${ay}Z`;
  };

  const wedges: { d: string; c: string }[] = [];
  let idx = 0;
  for (const status of ORDER) {
    const color = status === 'untested' ? colors.untested : statusColors[status];
    for (let i = 0; i < counts[status]; i++) {
      const base = -90 + idx * step;
      wedges.push({ d: arc(base + gap, base + step - gap), c: color });
      idx++;
    }
  }

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {wedges.map((w, i) => (
          <Path key={i} d={w.d} fill={w.c} />
        ))}
      </Svg>
      <View className="absolute items-center">
        <Text className="font-display" style={{ color: colors.white, fontSize: size * 0.225, letterSpacing: -1 }}>
          {centerValue}
        </Text>
        {centerLabel ? (
          <Text
            className="font-mono uppercase"
            style={{ color: colors.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 2 }}
          >
            {centerLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
