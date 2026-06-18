'use client';

import type { BiomarkerStatus, Intervention } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import {
  Button,
  EmptyRow,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  StatusPill,
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';

const CATEGORIES = ['supplement', 'nutrition', 'lifestyle', 'retest'] as const;
const EVIDENCE = ['strong', 'moderate', 'limited'] as const;
const STATUSES: BiomarkerStatus[] = ['optimal', 'suboptimal', 'alert', 'untested'];

interface FormState {
  name: string;
  slug: string;
  category: (typeof CATEGORIES)[number];
  summary: string;
  detail: string;
  dosage: string;
  evidence_level: (typeof EVIDENCE)[number];
  url: string;
  target_biomarker_slugs: string;
  trigger_statuses: BiomarkerStatus[];
  is_active: boolean;
  display_order: number;
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  category: 'supplement',
  summary: '',
  detail: '',
  dosage: '',
  evidence_level: 'moderate',
  url: '',
  target_biomarker_slugs: '',
  trigger_statuses: ['suboptimal', 'alert'],
  is_active: true,
  display_order: 0,
};

export default function InterventionsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .interventions()
      .then((r) => setRows(r.interventions))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: rows.length + 1 });
    setOpen(true);
  };
  const openEdit = (i: Intervention) => {
    setEditing(i.id);
    setForm({
      name: i.name,
      slug: i.slug,
      category: i.category,
      summary: i.summary,
      detail: i.detail,
      dosage: i.dosage,
      evidence_level: i.evidence_level,
      url: i.url,
      target_biomarker_slugs: i.target_biomarker_slugs.join(', '),
      trigger_statuses: i.trigger_statuses,
      is_active: i.is_active,
      display_order: i.display_order,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.slug) return push('error', 'Name and slug are required');
    setBusy(true);
    const body = {
      ...form,
      target_biomarker_slugs: form.target_biomarker_slugs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editing) await api.updateIntervention(editing, body);
      else await api.createIntervention(body);
      push('success', 'Saved');
      setOpen(false);
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (i: Intervention) => {
    if (!confirm(`Delete “${i.name}”?`)) return;
    try {
      await api.deleteIntervention(i.id);
      push('success', 'Deleted');
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const toggleStatus = (s: BiomarkerStatus) =>
    setForm((f) => ({
      ...f,
      trigger_statuses: f.trigger_statuses.includes(s)
        ? f.trigger_statuses.filter((x) => x !== s)
        : [...f.trigger_statuses, s],
    }));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Interventions</h1>
        <Button onClick={openNew}>Add intervention</Button>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-inkSoft">
        The supplement / nutrition / lifestyle / retest catalog. An item is recommended to a user
        when one of its target biomarkers is in a trigger status.
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <Table head={<><Th>Order</Th><Th>Name</Th><Th>Category</Th><Th>Targets</Th><Th>Evidence</Th><Th>Active</Th><Th /></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={7} label="No interventions yet." />
          ) : (
            rows.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <Td className="text-inkMuted">{i.display_order}</Td>
                <Td className="font-medium text-ink">{i.name}</Td>
                <Td className="capitalize text-inkSoft">{i.category}</Td>
                <Td className="text-inkSoft">{i.target_biomarker_slugs.length}</Td>
                <Td className="capitalize text-inkSoft">{i.evidence_level}</Td>
                <Td><StatusPill status={i.is_active ? 'active' : 'expired'} /></Td>
                <Td>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(i)} className="text-sm text-greenInk hover:underline">Edit</button>
                    <button onClick={() => remove(i)} className="text-sm text-rust hover:underline">Delete</button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit intervention' : 'New intervention'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="omega-3" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FormState['category'] })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Evidence">
              <Select value={form.evidence_level} onChange={(e) => setForm({ ...form, evidence_level: e.target.value as FormState['evidence_level'] })}>
                {EVIDENCE.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Display order"><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Summary"><Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
          <Field label="Detail"><Textarea rows={3} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dosage / how"><Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} /></Field>
            <Field label="Link (optional)"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
          </div>
          <Field label="Target biomarker slugs (comma-separated)">
            <Input value={form.target_biomarker_slugs} onChange={(e) => setForm({ ...form, target_biomarker_slugs: e.target.value })} placeholder="triglycerides, apob, hba1c" />
          </Field>
          <div>
            <div className="mb-1 text-sm text-inkSoft">Trigger when status is</div>
            <div className="flex gap-3">
              {STATUSES.map((s) => (
                <label key={s} className="flex items-center gap-1 text-sm capitalize text-ink">
                  <input type="checkbox" checked={form.trigger_statuses.includes(s)} onChange={() => toggleStatus(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
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
