'use client';

/**
 * App-wide toast host. Mirrors the mobile `Toast` component: a bordered warm
 * panel tinted by kind, anchored top-centre, auto-dismissing after 4s.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ToastKind = 'error' | 'success' | 'info';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  push: (kind: ToastKind, text: string) => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ACCENT: Record<ToastKind, string> = {
  error: '#C2603C',
  success: '#6FA97D',
  info: '#6E8BA0',
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = ++counter;
    setMessages((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== id)), 4000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (text: string) => push('success', text),
      error: (text: string) => push('error', text),
      info: (text: string) => push('info', text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className="w-full max-w-md animate-vital-in rounded-md border bg-card px-4 py-3 text-[13px] text-ink shadow-[0_4px_16px_rgba(32,32,28,0.08)]"
            style={{ borderColor: ACCENT[m.kind] }}
            role={m.kind === 'error' ? 'alert' : 'status'}
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
