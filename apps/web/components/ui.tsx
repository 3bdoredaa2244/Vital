'use client';

/**
 * VITAL web design system.
 *
 * Every primitive here is a direct web translation of its counterpart in
 * `apps/mobile/components/ui/*`: same palette roles, same tight radii
 * (2/4/8px), same uppercase-Inter "eyebrow" treatment for labels and buttons.
 * If you need a new primitive, add it here rather than styling ad hoc in a
 * page — that is what keeps web and mobile reading as one product.
 */
import type { BiomarkerStatus } from '@vital/shared';
import { STATUS_LABELS } from '@vital/shared';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useEffect } from 'react';

import { statusColors } from '@/lib/theme';

// ── Button ───────────────────────────────────────────────────────────────────
// Mirrors mobile Button: primary = clay accent on cream, secondary = warm panel
// with a hairline, ghost = bare. Label is uppercase Inter with wide tracking.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-canvas hover:bg-accent/90 active:bg-accent',
    secondary: 'border border-line bg-panel text-ink hover:bg-line/60',
    ghost: 'text-inkSoft hover:bg-panel hover:text-ink',
    danger: 'border border-rust text-rust hover:bg-rust/10',
  };
  return (
    <button
      disabled={disabled || loading}
      className={`vital-eyebrow inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={`rounded-lg border border-line bg-card ${className}`}>{children}</Tag>;
}

/** A card that responds to hover/press — for navigable rows and tiles. */
export function InteractiveCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-lg border border-line bg-card transition hover:border-accentSoft hover:shadow-[0_1px_0_0_rgba(32,32,28,0.04)] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────

/** Small uppercase eyebrow label — the VITAL section/field marker. */
export function Eyebrow({
  children,
  className = '',
  tone = 'accent',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'accent' | 'muted' | 'soft';
}) {
  const tones = { accent: 'text-accent', muted: 'text-inkMuted', soft: 'text-inkSoft' };
  return <div className={`vital-eyebrow ${tones[tone]} ${className}`}>{children}</div>;
}

/** Section header with an optional right-hand action — mirrors mobile. */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow>{title}</Eyebrow>
        {subtitle ? <p className="mt-1 text-[13px] text-inkSoft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Page title block used at the top of every authenticated route. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-inkSoft">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

// ── Forms ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="vital-eyebrow mb-1.5 block text-inkSoft">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rust" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-inkMuted">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  'w-full rounded-md border bg-panel px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkMuted focus:border-accent disabled:opacity-60';

// These three MUST forward refs. react-hook-form's `register()` returns a `ref`
// callback, and spreading `{...register('email')}` onto a plain function
// component silently drops it — react-hook-form then reads `undefined` for
// every field and validation fails with "Required" on a visibly filled form.

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ invalid, className = '', ...props }, ref) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${controlBase} ${invalid ? 'border-rust' : 'border-line'} ${className}`}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ invalid, className = '', ...props }, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${controlBase} ${invalid ? 'border-rust' : 'border-line'} ${className}`}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ invalid, className = '', ...props }, ref) {
  return (
    <select
      {...props}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${controlBase} ${invalid ? 'border-rust' : 'border-line'} ${className}`}
    />
  );
});

/** Square checkbox matching the mobile terms-acceptance control. */
export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-sm border transition ${
          checked ? 'border-accent bg-accent' : 'border-line bg-transparent'
        }`}
      >
        {checked ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="text-[13px] leading-snug text-ink">{label}</span>
    </label>
  );
}

// ── Status & badges ──────────────────────────────────────────────────────────

/** Biomarker status pill — dot + uppercase label, tinted with the status hue. */
export function StatusBadge({
  status,
  size = 'md',
}: {
  status: BiomarkerStatus;
  size?: 'sm' | 'md';
}) {
  const color = statusColors[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border font-mono font-medium uppercase tracking-eyebrow ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]'
      }`}
      style={{ backgroundColor: `${color}1A`, borderColor: color, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Generic pill for non-biomarker states (booking status, plan name, …). */
export function Badge({
  children,
  color,
  className = '',
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  if (!color) {
    return (
      <span
        className={`inline-flex items-center rounded-sm border border-line bg-panel px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-inkSoft ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-eyebrow ${className}`}
      style={{ backgroundColor: `${color}1A`, borderColor: color, color }}
    >
      {children}
    </span>
  );
}

// ── Loading / empty / error states ───────────────────────────────────────────

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 4,
  className = '',
}: {
  width?: string | number;
  height?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      className={`block animate-vital-pulse bg-line ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Row skeletons for list pages — mirrors mobile's SkeletonList. */
export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-card p-4">
          <Skeleton width={40} height={40} radius={20} />
          <div className="flex-1">
            <Skeleton width="45%" height={14} />
            <div className="h-2" />
            <Skeleton width="25%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card skeletons for dashboard-style grids. */
export function SkeletonCards({ count = 3, height = 140 }: { count?: number; height?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-line bg-card p-5" style={{ height }}>
          <Skeleton width="40%" height={11} />
          <div className="h-4" />
          <Skeleton width="70%" height={24} />
          <div className="h-3" />
          <Skeleton width="55%" height={12} />
        </div>
      ))}
    </div>
  );
}

/** Centred icon + message + optional CTA — mirrors mobile's EmptyState. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}: {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-8 py-16 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-panel text-inkSoft">
        {icon}
      </div>
      <h3 className="font-display text-[22px] text-ink">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-sm leading-relaxed text-inkSoft">{message}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/**
 * Failure state. Distinguishes "we couldn't reach the server" from "the server
 * said no" so the user knows whether retrying is worth it.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  className = '',
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-rust/30 bg-rust/[0.04] px-8 py-12 text-center ${className}`}
      role="alert"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-display text-lg text-ink">{title ?? 'Something went wrong'}</h3>
      <p className="mt-1.5 max-w-md text-sm text-inkSoft">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Full-height centred spinner for route-level loading. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-inkMuted" aria-busy="true">
      <Spinner size={28} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${width} animate-vital-in rounded-t-lg border border-line bg-card sm:rounded-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-inkMuted transition hover:bg-panel hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Data display ─────────────────────────────────────────────────────────────

/** Circular progress ring — the score/coverage motif from mobile. */
export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  color,
  label,
  sublabel,
}: {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={r} stroke="#E7DECC" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={color ?? '#6FA97D'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-ink" style={{ fontSize: size * 0.26 }}>
          {label ?? `${Math.round(clamped * 100)}%`}
        </span>
        {sublabel ? <span className="font-mono text-[9px] text-inkSoft">{sublabel}</span> : null}
      </div>
    </div>
  );
}

/** Horizontal rule with the warm hairline colour. */
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

/** Key/value row used across profile and detail pages. */
export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="vital-eyebrow text-inkMuted">{label}</span>
      <span className="text-right text-sm text-ink">{value}</span>
    </div>
  );
}
