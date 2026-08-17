'use client';

/**
 * Settings — session, support contact and lab-partner details (both served
 * from the admin-managed /app-content endpoint), plus the AI disclaimer that
 * applies to this account.
 *
 * There is deliberately no notification-preferences UI here: notification
 * rules are configured by admins (`/admin/notification-config`) and the API
 * exposes no per-user preference endpoint, so a toggle would be fiction.
 */
import { ExternalLink, LogOut, Mail, Phone } from 'lucide-react';

import { useToast } from '@/components/toast';
import { Button, Card, DataRow, Eyebrow, PageHeader, Skeleton } from '@/components/ui';
import { aiApi, contentApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';

export default function SettingsPage() {
  const { user, logout, subscription, hasActiveSubscription } = useAuth();
  const toast = useToast();

  const content = useApi(() => contentApi.get(), []);
  const aiStatus = useApi(() => aiApi.status(), []);

  const lab = content.data?.content.lab_partner;
  const supportEmail = content.data?.content.support_email;

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Your session, how to reach us, and the terms that apply to your data."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Session */}
        <Card className="p-5 sm:p-6">
          <Eyebrow>Session</Eyebrow>
          <div className="mt-2">
            <DataRow label="Signed in as" value={user?.email ?? '—'} />
            <DataRow
              label="Plan"
              value={
                subscription && hasActiveSubscription ? (
                  <span className="capitalize">{subscription.plan.name}</span>
                ) : (
                  'No active plan'
                )
              }
            />
          </div>
          <Button
            variant="danger"
            className="mt-4"
            icon={<LogOut size={15} />}
            onClick={() => void logout()}
          >
            Sign out
          </Button>
        </Card>

        {/* Support */}
        <Card className="p-5 sm:p-6">
          <Eyebrow>Support</Eyebrow>
          {content.loading ? (
            <Skeleton height={80} className="mt-3" />
          ) : content.error ? (
            <p className="mt-3 text-sm text-inkSoft">Could not load support details.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Mail size={15} /> {supportEmail}
                </a>
              ) : (
                <p className="text-sm text-inkSoft">No support address published.</p>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(user?.id ?? '')
                    .then(() => toast.success('Account ID copied — useful when contacting support.'))
                    .catch(() => toast.error('Could not copy your account ID.'));
                }}
              >
                Copy account ID
              </Button>
            </div>
          )}
        </Card>

        {/* Lab partner */}
        {lab && lab.name ? (
          <Card className="p-5 sm:p-6">
            <Eyebrow>Lab partner</Eyebrow>
            <h3 className="mt-1 font-display text-xl text-ink">{lab.name}</h3>
            {lab.description ? (
              <p className="mt-1 text-[13px] leading-relaxed text-inkSoft">{lab.description}</p>
            ) : null}
            <div className="mt-3 space-y-2">
              {lab.phone ? (
                <a
                  href={`tel:${lab.phone}`}
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Phone size={15} /> {lab.phone}
                </a>
              ) : null}
              {lab.url ? (
                <a
                  href={lab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <ExternalLink size={15} /> Visit website
                </a>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* AI terms */}
        <Card className="p-5 sm:p-6">
          <Eyebrow>AI health intelligence</Eyebrow>
          {aiStatus.loading ? (
            <Skeleton height={60} className="mt-3" />
          ) : !aiStatus.data?.status.enabled ? (
            <p className="mt-3 text-sm text-inkSoft">
              AI features are currently switched off for this VITAL deployment.
            </p>
          ) : (
            <>
              <div className="mt-2">
                <DataRow
                  label="Insights"
                  value={aiStatus.data.status.features.insights ? 'On' : 'Off'}
                />
                <DataRow label="Chat" value={aiStatus.data.status.features.chat ? 'On' : 'Off'} />
                <DataRow
                  label="Self-service generation"
                  value={aiStatus.data.status.allow_user_generate ? 'Allowed' : 'Team-reviewed'}
                />
              </div>
              {aiStatus.data.status.disclaimer ? (
                <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-inkMuted">
                  {aiStatus.data.status.disclaimer}
                </p>
              ) : null}
            </>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-inkMuted">
        VITAL is a preventive-health platform. Nothing here is a medical diagnosis or a substitute
        for advice from a licensed clinician.
      </p>
    </div>
  );
}
