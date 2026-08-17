'use client';

/**
 * Notification feed — alerts, retest reminders, score changes, booking and
 * visit updates. Unread items are marked read individually or in bulk.
 */
import type { AppNotification, NotificationSeverity } from '@vital/shared';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonList } from '@/components/ui';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatRelative } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: '#6E8BA0',
  warning: '#CDA24E',
  critical: '#C2603C',
};

/**
 * The API stores in-app deep links in mobile form (e.g. "biomarker/<id>",
 * "booking"). Translate the ones the web app has a route for; anything else
 * renders without a link rather than sending the user to a 404.
 */
function webHref(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith('biomarker/')) return `/biomarkers/${link.slice('biomarker/'.length)}`;
  if (link === 'booking' || link === 'bookings') return '/bookings';
  if (link === 'score') return '/score';
  if (link === 'insights' || link === 'ai') return '/ai';
  if (link === 'recommendations') return '/recommendations';
  if (link === 'results') return '/results';
  if (link === 'subscription' || link === 'plans') return '/subscriptions';
  return null;
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: () => void;
}) {
  const unread = !notification.read_at;
  const href = webHref(notification.link);

  const body = (
    <div className={`flex gap-3 px-5 py-4 transition ${href ? 'hover:bg-panel/50' : ''}`}>
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: unread ? SEVERITY_COLOR[notification.severity] : 'transparent',
          border: unread ? 'none' : '1px solid #E7DECC',
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className={`text-[15px] ${unread ? 'font-medium text-ink' : 'text-inkSoft'}`}>
            {notification.title}
          </h3>
          <span className="shrink-0 text-[11px] text-inkMuted">
            {formatRelative(notification.created_at)}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-inkSoft">{notification.body}</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge color={SEVERITY_COLOR[notification.severity]}>{notification.type}</Badge>
          {unread ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onRead();
              }}
              className="text-[11px] text-accent hover:underline"
            >
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} onClick={() => unread && onRead()} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function NotificationsPage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const enabled = subscriptionLoaded && hasActiveSubscription;
  const toast = useToast();
  const [marking, setMarking] = useState(false);

  const feed = useApi(() => notificationApi.feed(), [], enabled);

  const markRead = async (ids?: string[]) => {
    setMarking(true);
    try {
      await notificationApi.markRead(ids);
      feed.reload();
    } catch (err) {
      toast.error(messageFor(err, 'Could not update your notifications.'));
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = feed.data?.unread_count ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        subtitle="Out-of-range alerts, retest reminders, score changes, and visit updates."
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              icon={<CheckCheck size={15} />}
              loading={marking}
              onClick={() => void markRead()}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <AsyncSection
        state={feed}
        feature="your notification feed"
        loading={<SkeletonList count={5} />}
        isEmpty={(d) => d.notifications.length === 0}
        empty={
          <EmptyState
            icon={<Bell size={26} />}
            title="Nothing here yet"
            message="We'll let you know when a marker moves out of range, when it's time to retest, and when a visit is on its way."
          />
        }
      >
        {(data) => (
          <Card className="divide-y divide-line">
            {data.notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={() => void markRead([n.id])}
              />
            ))}
          </Card>
        )}
      </AsyncSection>
    </div>
  );
}
