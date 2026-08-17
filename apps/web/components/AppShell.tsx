'use client';

/**
 * Authenticated shell: fixed sidebar on desktop, slide-over drawer on mobile,
 * plus a top bar carrying notifications and the account menu.
 *
 * Navigation labels and ordering follow the mobile app's information
 * architecture (Dashboard → Biomarkers → Profile as the primary tabs, with
 * Score, AI, Recommendations, Bookings and Subscription as the pushed routes
 * the dashboard links to). The web layout surfaces them all at once because
 * there is room to; the vocabulary is unchanged.
 */
import {
  Activity,
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  TestTube,
  User as UserIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { notificationApi } from '@/lib/api';
import { VitalLogo } from './Logo';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/score', label: 'VITAL Score', icon: <Activity size={18} /> },
  { href: '/biomarkers', label: 'Biomarkers', icon: <FlaskConical size={18} /> },
  { href: '/results', label: 'Results', icon: <TestTube size={18} /> },
  { href: '/ai', label: 'VITAL AI', icon: <Sparkles size={18} /> },
  { href: '/recommendations', label: 'Recommendations', icon: <ClipboardList size={18} /> },
  { href: '/bookings', label: 'Bookings', icon: <CalendarCheck size={18} /> },
  { href: '/subscriptions', label: 'Subscription', icon: <CreditCard size={18} /> },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { href: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  onNavigate,
  badge,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
        active
          ? 'bg-panel font-medium text-accent'
          : 'text-inkSoft hover:bg-panel/70 hover:text-ink'
      }`}
    >
      <span className={active ? 'text-accent' : 'text-inkMuted'}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {badge && badge > 0 ? (
        <span className="min-w-[20px] rounded-full bg-rust px-1.5 py-0.5 text-center font-mono text-[10px] font-medium text-canvas">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  unread,
}: {
  pathname: string;
  onNavigate?: () => void;
  unread: number;
}) {
  const { user, subscription, hasActiveSubscription, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Link href="/dashboard" onClick={onNavigate} aria-label="VITAL — Dashboard">
          <VitalLogo size={72} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="my-4 border-t border-line" />

        <div className="space-y-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              onNavigate={onNavigate}
              badge={item.href === '/notifications' ? unread : undefined}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-ink">{user?.full_name ?? '—'}</p>
          <p className="truncate text-xs text-inkMuted">{user?.email}</p>
          {subscription && hasActiveSubscription ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-accent">
              {subscription.plan.name} plan
            </p>
          ) : (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-inkMuted">
              No active plan
            </p>
          )}
        </div>
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-inkSoft transition hover:bg-panel hover:text-rust"
        >
          <LogOut size={18} className="text-inkMuted" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();

  // The notification feed is subscription-gated; only poll it when the user can
  // actually read it, so we don't spam the console with expected 403s.
  useEffect(() => {
    if (!subscriptionLoaded || !hasActiveSubscription) return;
    let cancelled = false;
    notificationApi
      .feed()
      .then((r) => {
        if (!cancelled) setUnread(r.unread_count);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subscriptionLoaded, hasActiveSubscription, pathname]);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-canvas lg:block xl:w-64">
        <SidebarContent pathname={pathname} unread={unread} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-vital-in border-r border-line bg-canvas">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-sm p-1.5 text-inkMuted transition hover:bg-panel hover:text-ink"
            >
              <X size={18} />
            </button>
            <SidebarContent
              pathname={pathname}
              unread={unread}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — visible on all sizes; carries the drawer trigger on small screens. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-sm p-1.5 text-inkSoft transition hover:bg-panel hover:text-ink lg:hidden"
          >
            <Menu size={20} />
          </button>

          <Link href="/dashboard" className="lg:hidden" aria-label="VITAL">
            <VitalLogo size={44} />
          </Link>

          <div className="flex-1" />

          <Link
            href="/notifications"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative rounded-sm p-1.5 text-inkSoft transition hover:bg-panel hover:text-ink"
          >
            <Bell size={19} />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rust px-1 font-mono text-[9px] font-medium text-canvas">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Link>

          <Link
            href="/profile"
            aria-label="Profile"
            className="rounded-sm p-1.5 text-inkSoft transition hover:bg-panel hover:text-ink"
          >
            <UserIcon size={19} />
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
