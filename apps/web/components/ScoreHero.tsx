'use client';

/**
 * The VITAL Score centrepiece — a band-coloured ring, the 0–100 number, test
 * coverage, biological age, sub-scores and a trend sparkline.
 *
 * A direct translation of `apps/mobile/components/ui/ScoreHero.tsx`: same
 * layout order, same copy, same band colours from @vital/shared.
 */
import type { ScoreHistoryPoint, VitalScore } from '@vital/shared';
import { scoreBand } from '@vital/shared';

import { colors } from '@/lib/theme';
import { Card } from './ui';

function Ring({ score, color, size = 128 }: { score: number; color: string; size?: number }) {
  const strokeWidth = 9;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={r} stroke={colors.line} strokeWidth={strokeWidth} fill="none" />
        <circle
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
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display leading-none text-ink" style={{ fontSize: size * 0.32 }}>
          {score}
        </span>
        <span className="mt-0.5 text-[11px] text-inkSoft">/ 100</span>
      </div>
    </div>
  );
}

function Sparkline({
  history,
  color,
  width = 220,
  height = 44,
}: {
  history: ScoreHistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (history.length < 2) return null;
  const pad = 4;
  const xs = (i: number) => pad + (i / (history.length - 1)) * (width - pad * 2);
  const ys = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
  const points = history.map((p, i) => `${xs(i)},${ys(p.score)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubScore({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="font-display text-xl text-ink">
        {value == null ? '—' : `${value}${suffix ?? ''}`}
      </div>
      <div className="mt-0.5 text-[11px] text-inkSoft">{label}</div>
    </div>
  );
}

export function ScoreHero({
  score,
  history,
  compact = false,
}: {
  score: VitalScore;
  history: ScoreHistoryPoint[];
  compact?: boolean;
}) {
  const band = scoreBand(score.score);
  const hasResults = score.tested_count > 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="vital-eyebrow text-inkSoft">VITAL Score</div>

      <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Ring score={score.score} color={band.color} size={compact ? 116 : 132} />

        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl" style={{ color: band.color }}>
            {hasResults ? band.label : 'No results yet'}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-inkSoft">
            {hasResults
              ? `${score.tested_count} of ${score.total_count} markers tested`
              : 'Add a result or book your first test to generate your score.'}
          </p>

          {score.biological_age != null && score.chronological_age != null ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-xs"
                style={{ backgroundColor: `${band.color}1A`, color: band.color }}
              >
                Bio age {score.biological_age}
              </span>
              {score.age_delta != null && score.age_delta !== 0 ? (
                <span className="text-xs text-inkSoft">
                  {score.age_delta < 0
                    ? `${Math.abs(score.age_delta)}y younger`
                    : `${score.age_delta}y older`}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {hasResults ? (
        <div className="mt-5 flex border-t border-line pt-4">
          <SubScore label="Cardiometabolic" value={score.cardiometabolic_score} />
          <SubScore label="Longevity" value={score.longevity_score} />
          <SubScore label="Confidence" value={score.confidence} suffix="%" />
        </div>
      ) : null}

      {history.length >= 2 ? (
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-1.5 text-[11px] text-inkSoft">Trend</div>
          <Sparkline history={history} color={band.color} />
        </div>
      ) : null}
    </Card>
  );
}
