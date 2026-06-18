'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { BiomarkerStatus } from '@vital/shared';

// Status colour map — data only, never interactive chrome.
const STATUS_COLOR: Record<string, string> = {
  optimal: '#6FA97D',
  suboptimal: '#CDA24E',
  alert: '#C2603C',
  untested: '#A79E8D',
  active: '#6FA97D',
  completed: '#6FA97D',
  expired: '#A79E8D',
  cancelled: '#C2603C',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' }) {
  const styles: Record<string, string> = {
    primary: 'bg-accent text-canvas hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent/50',
    outline: 'border border-line text-ink hover:bg-panel focus-visible:ring-2 focus-visible:ring-accent/40',
    ghost: 'text-inkSoft hover:bg-panel focus-visible:ring-2 focus-visible:ring-accent/40',
    danger: 'border border-rust text-rust hover:bg-rust/10 focus-visible:ring-2 focus-visible:ring-rust/40',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium outline-none transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card ${className}`}>{children}</div>;
}

/** Small uppercase eyebrow label (card section headers). */
export function EyebrowLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-inkMuted ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-inkMuted">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rust">{error}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-inkMuted focus:border-accent ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-inkMuted focus:border-accent ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent ${props.className ?? ''}`}
    />
  );
}

/** Filter toolbar — a wrapping, bottom-aligned row of controls above a table. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3">{children}</div>;
}

/** Segmented control (e.g. the Details | Upload Results tabs). */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-panel p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40 ${
            active === t.value ? 'bg-card text-accent shadow-sm' : 'text-inkSoft hover:text-ink'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Toggle chip — assignment selections (e.g. a partner's service areas). */
export function AreaChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40 ${
        selected
          ? 'border-accent bg-accent text-canvas'
          : 'border-line bg-panel text-inkSoft hover:border-accent/40 hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

/** Label : value row with a hairline divider (detail cards). */
export function LabelRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: ReactNode;
  copyable?: boolean;
}) {
  const canCopy = copyable && value !== '—' && value != null;
  return (
    <div className="flex items-baseline justify-between border-b border-line py-2 text-sm last:border-0">
      <span className="shrink-0 text-inkMuted">{label}</span>
      <span
        className={`ml-4 text-right text-ink ${canCopy ? 'cursor-copy select-all' : ''}`}
        title={canCopy ? 'Click to copy' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#A79E8D';
  const label = status === 'active' ? 'booked' : status;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function StatusDot({ status }: { status: BiomarkerStatus }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[status] ?? '#A79E8D' }}
    />
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl border border-line bg-canvas p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-inkMuted hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-inkMuted">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-inkMuted">
        {label}
      </td>
    </tr>
  );
}

/** Page header — title + optional subtitle, with right-aligned actions. */
export function PageHd({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-inkSoft">{sub}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** KPI stat card — eyebrow label, big number, optional hint. */
export function KPICard({
  label,
  value,
  hint,
  tone = 'ink',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'ink' | 'accent' | 'alert';
}) {
  const valueColor = tone === 'alert' ? 'text-rust' : tone === 'accent' ? 'text-accent' : 'text-ink';
  return (
    <Card className="p-5">
      <EyebrowLabel className="mb-0">{label}</EyebrowLabel>
      <div className={`mt-3 font-display text-3xl font-extrabold tracking-tight ${valueColor}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-inkMuted">{hint}</div> : null}
    </Card>
  );
}
