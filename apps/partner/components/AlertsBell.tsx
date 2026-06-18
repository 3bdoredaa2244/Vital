'use client';

import type { AppNotification } from '@vital/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

/**
 * Alerts bell — the partner's feed of booking changes (new / rescheduled /
 * cancelled). Opening the panel marks everything read and clears the badge.
 * Shared by the appointments list and the appointment detail header.
 */
export function AlertsBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = () =>
    api
      .notifications()
      .then((r) => {
        setItems(r.notifications);
        setUnread(r.unread_count);
      })
      .catch(() => {});

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000); // refresh while the tab is open
    return () => clearInterval(t);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      void api.markNotificationsRead().catch(() => {});
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium text-inkSoft transition hover:border-accent hover:text-ink"
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-line bg-card p-2 shadow-lg">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-inkMuted">No alerts yet.</div>
            ) : (
              items.map((n) => {
                const body = (
                  <div
                    className="rounded-lg px-3 py-2.5 transition hover:bg-panel"
                    style={{ opacity: n.read_at ? 0.7 : 1 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{n.title}</span>
                      <span className="shrink-0 text-xs text-inkMuted">
                        {new Date(n.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-inkSoft">{n.body}</p>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={`/${n.link}`} onClick={() => setOpen(false)} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={n.id}>{body}</div>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
