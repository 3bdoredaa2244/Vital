'use client';

/**
 * RangeBar — horizontal 5-zone reference bar:
 *   low (rust) · suboptimal (amber) · optimal (green) · suboptimal (amber) · high (rust)
 * with the user's current value plotted as a marker.
 *
 * A direct translation of `apps/mobile/components/ui/RangeBar.tsx`, including
 * the ±25% domain padding around the normal window.
 */
import { formatNumber } from '@/lib/format';
import { colors } from '@/lib/theme';

interface RangeFields {
  optimal_low: number;
  optimal_high: number;
  normal_low: number;
  normal_high: number;
}

export function RangeBar({
  range,
  value,
  unit,
  mode = 'optimal',
  compact = false,
}: {
  range: RangeFields;
  value?: number | null;
  unit: string;
  mode?: 'optimal' | 'normal';
  compact?: boolean;
}) {
  const { optimal_low, optimal_high, normal_low, normal_high } = range;

  const span = Math.max(normal_high - normal_low, 1e-6);
  const domainMin = normal_low - span * 0.25;
  const domainMax = normal_high + span * 0.25;
  const domain = Math.max(domainMax - domainMin, 1e-6);

  const pct = (x: number) => Math.max(0, Math.min(1, (x - domainMin) / domain));

  const zones: Array<[number, number, string]> = [
    [pct(domainMin), pct(normal_low), colors.rust],
    [pct(normal_low), pct(optimal_low), colors.amber],
    [pct(optimal_low), pct(optimal_high), colors.green],
    [pct(optimal_high), pct(normal_high), colors.amber],
    [pct(normal_high), pct(domainMax), colors.rust],
  ];

  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  const markerPct = hasValue ? pct(value as number) : null;
  const emphasised = mode === 'optimal' ? [optimal_low, optimal_high] : [normal_low, normal_high];

  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-sm bg-line">
        {zones.map(([start, end, color], i) => (
          <span
            key={i}
            className="absolute top-0 h-full"
            style={{
              left: `${start * 100}%`,
              width: `${Math.max(end - start, 0) * 100}%`,
              backgroundColor: color,
              opacity: mode === 'optimal' && i === 2 ? 1 : 0.85,
            }}
          />
        ))}

        {markerPct !== null ? (
          <span
            className="absolute -top-[3px] block h-[18px] w-[14px] rounded-[3px] border-2 border-ink bg-card"
            style={{ left: `calc(${markerPct * 100}% - 7px)` }}
            aria-hidden
          />
        ) : null}
      </div>

      {compact ? null : (
        <div className="mt-2 flex justify-between font-mono text-[10px] text-inkSoft">
          <span>{formatNumber(emphasised[0]!)}</span>
          <span>
            {mode === 'optimal' ? 'Optimal' : 'Normal'} ({unit})
          </span>
          <span>{formatNumber(emphasised[1]!)}</span>
        </div>
      )}
    </div>
  );
}
