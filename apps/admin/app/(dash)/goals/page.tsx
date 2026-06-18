'use client';

import type { HealthGoalOption } from '@vital/shared';
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
  Th,
  PageHd,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';

interface FormState {
  slug: string;
  label: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

const EMPTY: FormState = { slug: '', label: '', icon: '', display_order: 0, is_active: true };

export default function GoalsPage() {
  const { push } = useToast();
  const [goals, setGoals] = useState<HealthGoalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .goals()
      .then((r) => setGoals(r.goals))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: goals.length + 1 });
    setOpen(true);
  };
  const openEdit = (g: HealthGoalOption) => {
    setEditing(g.id);
    setForm({ slug: g.slug, label: g.label, icon: g.icon, display_order: g.display_order, is_active: g.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.slug || !form.label) return push('error', 'Slug and label are required');
    setBusy(true);
    try {
      if (editing) await api.updateGoal(editing, form);
      else await api.createGoal(form);
      push('success', 'Saved');
      setOpen(false);
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (g: HealthGoalOption) => {
    if (!confirm(`Delete goal “${g.label}”?`)) return;
    try {
      await api.deleteGoal(g.id);
      push('success', 'Deleted');
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  return (
    <div>
      <PageHd
        title="Health Goals"
        sub="The goals users pick during onboarding (up to 3). The icon is a Lucide icon name."
      >
        <Button onClick={openNew}>Add goal</Button>
      </PageHd>

      {loading ? (
        <Spinner />
      ) : (
        <Table head={<><Th>Order</Th><Th>Label</Th><Th>Slug</Th><Th>Icon</Th><Th>Active</Th><Th /></>}>
          {goals.length === 0 ? (
            <EmptyRow colSpan={6} label="No goals yet." />
          ) : (
            goals.map((g) => (
              <tr key={g.id} className="border-b border-line last:border-0">
                <Td className="text-inkMuted">{g.display_order}</Td>
                <Td className="font-medium text-ink">{g.label}</Td>
                <Td className="text-inkSoft">{g.slug}</Td>
                <Td className="text-inkSoft">{g.icon}</Td>
                <Td><StatusPill status={g.is_active ? 'active' : 'expired'} /></Td>
                <Td>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(g)} className="text-sm text-greenInk hover:underline">Edit</button>
                    <button onClick={() => remove(g)} className="text-sm text-rust hover:underline">Delete</button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit goal' : 'New goal'}>
        <div className="space-y-4">
          <Field label="Label"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Optimize energy levels" /></Field>
          <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="optimize_energy" /></Field>
          <Field label="Icon (Lucide name)"><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Zap" /></Field>
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
