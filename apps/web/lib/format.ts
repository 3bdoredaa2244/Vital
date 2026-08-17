/**
 * Display formatters. Mirrors `apps/mobile/lib/format.ts` conventions so the
 * same value reads identically on web and mobile (en-GB dates, trimmed
 * decimals).
 */

/** Trim trailing zeros: 5.00 → "5", 5.20 → "5.2", 0.123 → "0.12". */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return String(Number(value.toFixed(decimals)));
}

/** "2026-06-03" → "3 Jun 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "2026-06-03T11:37:00Z" → "3 Jun 2026, 11:37". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative age of a timestamp, for the notification feed. */
export function formatRelative(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

/** "07:00" → "07:00" (kept 24h, matching the mobile booking UI). */
export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`;
}

/** EGP amounts, e.g. 4500 → "EGP 4,500". */
export function formatEgp(amount: number): string {
  return `EGP ${amount.toLocaleString('en-GB')}`;
}

/** Today as an ISO calendar date (YYYY-MM-DD) in the user's local timezone. */
export function todayIso(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Add N days to an ISO calendar date. */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** "2026-06-03" → "Wed 3 Jun". */
export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
