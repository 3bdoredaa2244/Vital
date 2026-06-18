/**
 * ScoreHero — the dashboard centerpiece for the VITAL Score: a band-colored
 * ring with the 0–100 number, the band label, test coverage, an optional
 * biological-age chip, and a small history sparkline.
 */
import type { ScoreHistoryPoint, VitalScore } from '@vital/shared';
import { scoreBand } from '@vital/shared';
import { Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors } from '@/constants/theme';

function Ring({ score, color, size = 116 }: { score: number; color: string; size?: number }) {
  const strokeWidth = 9;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={colors.line} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="font-display" style={{ color: colors.ink, fontSize: size * 0.32 }}>
          {score}
        </Text>
        <Text className="font-body" style={{ color: colors.inkSoft, fontSize: 11, marginTop: -2 }}>
          / 100
        </Text>
      </View>
    </View>
  );
}

function Sparkline({ history, color }: { history: ScoreHistoryPoint[]; color: string }) {
  if (history.length < 2) return null;
  const w = 120;
  const h = 32;
  const pad = 3;
  const xs = (i: number) => pad + (i / (history.length - 1)) * (w - pad * 2);
  const ys = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2);
  const points = history.map((p, i) => `${xs(i)},${ys(p.score)}`).join(' ');
  return (
    <Svg width={w} height={h}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SubScore({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="font-display" style={{ color: colors.ink, fontSize: 20 }}>
        {value == null ? '—' : `${value}${suffix ?? ''}`}
      </Text>
      <Text className="font-body" style={{ color: colors.inkSoft, fontSize: 11, marginTop: 1 }}>
        {label}
      </Text>
    </View>
  );
}

export function ScoreHero({
  score,
  history,
}: {
  score: VitalScore;
  history: ScoreHistoryPoint[];
}) {
  const band = scoreBand(score.score);
  const hasResults = score.tested_count > 0;

  return (
    <View
      className="rounded-lg border p-5"
      style={{ backgroundColor: colors.card, borderColor: colors.line }}
    >
      <Text className="font-mono uppercase tracking-widest" style={{ color: colors.inkSoft, fontSize: 11 }}>
        VITAL Score
      </Text>

      <View className="mt-3 flex-row items-center">
        <Ring score={score.score} color={band.color} />
        <View className="ml-5 flex-1">
          <Text className="font-display" style={{ color: band.color, fontSize: 22 }}>
            {hasResults ? band.label : 'No results yet'}
          </Text>
          <Text className="mt-1 font-body" style={{ color: colors.inkSoft, fontSize: 13, lineHeight: 18 }}>
            {hasResults
              ? `${score.tested_count} of ${score.total_count} markers tested`
              : 'Add a result or book your first test to generate your score.'}
          </Text>

          {score.biological_age != null && score.chronological_age != null ? (
            <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
              <View
                className="rounded-full px-2 py-1"
                style={{ backgroundColor: `${band.color}1A` }}
              >
                <Text className="font-body" style={{ color: band.color, fontSize: 12 }}>
                  Bio age {score.biological_age}
                </Text>
              </View>
              {score.age_delta != null && score.age_delta !== 0 ? (
                <Text className="font-body" style={{ color: colors.inkSoft, fontSize: 12 }}>
                  {score.age_delta < 0
                    ? `${Math.abs(score.age_delta)}y younger`
                    : `${score.age_delta}y older`}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {/* Sub-scores */}
      {hasResults ? (
        <View className="mt-4 flex-row border-t pt-3" style={{ borderColor: colors.line }}>
          <SubScore label="Cardiometabolic" value={score.cardiometabolic_score} />
          <SubScore label="Longevity" value={score.longevity_score} />
          <SubScore label="Confidence" value={score.confidence} suffix="%" />
        </View>
      ) : null}

      {history.length >= 2 ? (
        <View className="mt-4 border-t pt-3" style={{ borderColor: colors.line }}>
          <Text className="font-body" style={{ color: colors.inkSoft, fontSize: 11, marginBottom: 4 }}>
            Trend
          </Text>
          <Sparkline history={history} color={band.color} />
        </View>
      ) : null}
    </View>
  );
}
