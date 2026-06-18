'use client';

import type { BroadcastInput, NotificationConfigInput, NotificationStats } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { Button, Card, Field, Input, Select, Spinner, Textarea } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

export default function NotificationsPage() {
  const { push } = useToast();
  const [config, setConfig] = useState<NotificationConfigInput | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [busy, setBusy] = useState(false);

  const [bc, setBc] = useState<BroadcastInput>({ title: '', body: '', severity: 'info' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.notificationConfig().then((r) => setConfig(r.config)).catch((e) => push('error', e.message));
    api.notificationStats().then((r) => setStats(r.stats)).catch(() => {});
  }, [push]);

  if (!config) return <Spinner />;

  const saveConfig = async () => {
    setBusy(true);
    try {
      const { config: c } = await api.saveNotificationConfig(config);
      setConfig(c);
      push('success', 'Alert rules saved');
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const sendBroadcast = async () => {
    if (!bc.title || !bc.body) return push('error', 'Title and body required');
    if (!confirm('Send this announcement to all users?')) return;
    setSending(true);
    try {
      const r = await api.broadcast(bc);
      push('success', `Sent to ${r.sent} users`);
      setBc({ title: '', body: '', severity: 'info' });
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Notifications</h1>
      <p className="mb-6 max-w-2xl text-sm text-inkSoft">
        Rules for system-generated alerts, plus broadcasts to all users. Alerts are computed from
        each user&apos;s results and deduped automatically.
      </p>

      <div className="max-w-2xl space-y-6">
        {stats ? (
          <Card className="p-5">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><div className="font-display text-2xl font-bold text-ink">{stats.total}</div><div className="text-inkSoft">total sent</div></div>
              <div><div className="font-display text-2xl font-bold text-ink">{stats.unread}</div><div className="text-inkSoft">unread</div></div>
              <div><div className="font-display text-2xl font-bold text-ink">{stats.device_count}</div><div className="text-inkSoft">push devices</div></div>
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-ink">Alert rules</h3>
          <div className="space-y-3 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.out_of_range_alerts} onChange={(e) => setConfig({ ...config, out_of_range_alerts: e.target.checked })} />
              Out-of-range alerts (marker enters the alert range)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.score_drop_alerts} onChange={(e) => setConfig({ ...config, score_drop_alerts: e.target.checked })} />
              VITAL Score drop alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.retest_reminders} onChange={(e) => setConfig({ ...config, retest_reminders: e.target.checked })} />
              Re-test reminders
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Re-test cadence (months)">
              <Input type="number" value={config.retest_cadence_months} onChange={(e) => setConfig({ ...config, retest_cadence_months: Number(e.target.value) })} />
            </Field>
            <Field label="Score-drop threshold (points)">
              <Input type="number" value={config.score_drop_threshold} onChange={(e) => setConfig({ ...config, score_drop_threshold: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={saveConfig} disabled={busy}>{busy ? 'Saving…' : 'Save rules'}</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-ink">Broadcast announcement</h3>
          <div className="space-y-4">
            <Field label="Title"><Input value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} /></Field>
            <Field label="Message"><Textarea rows={3} value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} /></Field>
            <Field label="Severity">
              <Select value={bc.severity} onChange={(e) => setBc({ ...bc, severity: e.target.value as BroadcastInput['severity'] })}>
                <option value="info">info</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </Select>
            </Field>
            <Button onClick={sendBroadcast} disabled={sending}>{sending ? 'Sending…' : 'Send to all users'}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
