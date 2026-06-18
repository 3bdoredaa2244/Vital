'use client';

import type { NotificationTemplate } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import {
  Button,
  EmptyRow,
  Field,
  Input,
  Modal,
  Spinner,
  StatusPill,
  Table,
  Td,
  Textarea,
  Th,
  PageHd,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';

interface FormState {
  title: string;
  body: string;
  display_order: number;
  is_active: boolean;
}

const EMPTY: FormState = { title: '', body: '', display_order: 0, is_active: true };

export default function VisitNotificationsPage() {
  const { push } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .notificationTemplates()
      .then((r) => setTemplates(r.templates))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: templates.length + 1 });
    setOpen(true);
  };
  const openEdit = (t: NotificationTemplate) => {
    setEditing(t.id);
    setForm({ title: t.title, body: t.body, display_order: t.display_order, is_active: t.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return push('error', 'Title and message are required');
    setBusy(true);
    try {
      if (editing) await api.updateNotificationTemplate(editing, form);
      else await api.createNotificationTemplate(form);
      push('success', 'Saved');
      setOpen(false);
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: NotificationTemplate) => {
    if (!confirm(`Delete template “${t.title}”?`)) return;
    try {
      await api.deleteNotificationTemplate(t.id);
      push('success', 'Deleted');
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  return (
    <div>
      <PageHd
        title="Visit Notifications"
        sub="Preset messages the visiting doctor pushes to a patient before arriving (e.g. “Doctor arriving within 30 minutes”). Only active templates appear in the doctor’s app."
      >
        <Button onClick={openNew}>Add template</Button>
      </PageHd>

      {loading ? (
        <Spinner />
      ) : (
        <Table head={<><Th>Order</Th><Th>Title</Th><Th>Message</Th><Th>Active</Th><Th /></>}>
          {templates.length === 0 ? (
            <EmptyRow colSpan={5} label="No templates yet." />
          ) : (
            templates.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0">
                <Td className="text-inkMuted">{t.display_order}</Td>
                <Td className="font-medium text-ink">{t.title}</Td>
                <Td className="max-w-md text-inkSoft">{t.body}</Td>
                <Td><StatusPill status={t.is_active ? 'active' : 'expired'} /></Td>
                <Td>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(t)} className="text-sm text-greenInk hover:underline">Edit</button>
                    <button onClick={() => remove(t)} className="text-sm text-rust hover:underline">Delete</button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit template' : 'New template'}>
        <div className="space-y-4">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="On the way" maxLength={120} /></Field>
          <Field label="Message">
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Your VITAL doctor is on the way and will arrive within 30 minutes."
              rows={3}
              maxLength={300}
            />
          </Field>
          <Field label="Display order"><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
