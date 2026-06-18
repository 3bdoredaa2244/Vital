'use client';

import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/toast';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  StatusPill,
  Table,
  Td,
  Th,
  Textarea,
  EmptyRow,
  PageHd,
} from '@/components/ui';
import type { Biomarker, BiomarkerCategory } from '@vital/shared';

interface FormState {
  category_id: string;
  name: string;
  slug: string;
  unit: string;
  description: string;
  why_it_matters: string;
  what_affects_it: string;
  optimal_low: string;
  optimal_high: string;
  normal_low: string;
  normal_high: string;
  min_plausible: string;
  max_plausible: string;
  display_order: string;
  tags: string;
  addon_price_egp: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  category_id: '',
  name: '',
  slug: '',
  unit: '',
  description: '',
  why_it_matters: '',
  what_affects_it: '',
  optimal_low: '0',
  optimal_high: '0',
  normal_low: '0',
  normal_high: '0',
  min_plausible: '0',
  max_plausible: '0',
  display_order: '0',
  tags: '',
  addon_price_egp: '',
  is_active: true,
};

export default function BiomarkersPage() {
  const { push } = useToast();
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [categories, setCategories] = useState<BiomarkerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    try {
      const res = await api.categories();
      setCategories(res.categories);
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to load categories');
    }
  }

  async function loadBiomarkers() {
    setLoading(true);
    try {
      const res = await api.biomarkers({
        search: search || undefined,
        category: categoryFilter || undefined,
      });
      setBiomarkers(res.biomarkers);
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to load biomarkers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadBiomarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? '—';
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(b: Biomarker) {
    setEditing(b.id);
    setForm({
      category_id: b.category_id,
      name: b.name,
      slug: b.slug,
      unit: b.unit,
      description: b.description,
      why_it_matters: b.why_it_matters,
      what_affects_it: b.what_affects_it,
      optimal_low: String(b.optimal_low),
      optimal_high: String(b.optimal_high),
      normal_low: String(b.normal_low),
      normal_high: String(b.normal_high),
      min_plausible: String(b.min_plausible),
      max_plausible: String(b.max_plausible),
      display_order: String(b.display_order),
      tags: b.tags.join(', '),
      addon_price_egp: b.addon_price_egp != null ? String(b.addon_price_egp) : '',
      is_active: b.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      category_id: form.category_id,
      name: form.name,
      slug: form.slug,
      unit: form.unit,
      description: form.description,
      why_it_matters: form.why_it_matters,
      what_affects_it: form.what_affects_it,
      optimal_low: Number(form.optimal_low),
      optimal_high: Number(form.optimal_high),
      normal_low: Number(form.normal_low),
      normal_high: Number(form.normal_high),
      min_plausible: Number(form.min_plausible),
      max_plausible: Number(form.max_plausible),
      display_order: Number(form.display_order),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      addon_price_egp: form.addon_price_egp.trim() === '' ? null : Number(form.addon_price_egp),
      is_active: form.is_active,
    };

    const ok =
      payload.min_plausible <= payload.normal_low &&
      payload.normal_low <= payload.optimal_low &&
      payload.optimal_low <= payload.optimal_high &&
      payload.optimal_high <= payload.normal_high &&
      payload.normal_high <= payload.max_plausible;
    if (!ok) {
      push(
        'error',
        'Ranges must satisfy: min_plausible ≤ normal_low ≤ optimal_low ≤ optimal_high ≤ normal_high ≤ max_plausible',
      );
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.updateBiomarker(editing, payload);
      } else {
        await api.createBiomarker(payload);
      }
      setModalOpen(false);
      push('success', editing ? 'Biomarker updated' : 'Biomarker created');
      await loadBiomarkers();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to save biomarker');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(b: Biomarker) {
    if (!confirm(`Deactivate "${b.name}"?`)) return;
    try {
      await api.deleteBiomarker(b.id);
      push('success', 'Biomarker deactivated');
      await loadBiomarkers();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to deactivate biomarker');
    }
  }

  return (
    <div>
      <PageHd title="Biomarkers" sub="The marker catalog and reference ranges.">
        <Button onClick={openCreate}>Add Biomarker</Button>
      </PageHd>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Search biomarkers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          head={
            <>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Unit</Th>
              <Th>Optimal Range</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
        >
          {biomarkers.length === 0 ? (
            <EmptyRow colSpan={6} label="No biomarkers found" />
          ) : (
            biomarkers.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <Td className="font-medium text-ink">{b.name}</Td>
                <Td className="text-inkSoft">{categoryName(b.category_id)}</Td>
                <Td className="text-inkSoft">{b.unit}</Td>
                <Td>
                  {b.optimal_low}–{b.optimal_high}
                </Td>
                <Td>
                  <StatusPill status={b.is_active ? 'active' : 'expired'} />
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => openEdit(b)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeactivate(b)}>
                      Deactivate
                    </Button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Biomarker' : 'New Biomarker'}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Category">
            <Select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="lowercase-dashes"
              />
            </Field>
          </div>
          <Field label="Unit">
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Why It Matters">
            <Textarea
              rows={2}
              value={form.why_it_matters}
              onChange={(e) => setForm({ ...form, why_it_matters: e.target.value })}
            />
          </Field>
          <Field label="What Affects It">
            <Textarea
              rows={2}
              value={form.what_affects_it}
              onChange={(e) => setForm({ ...form, what_affects_it: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Plausible">
              <Input
                type="number"
                value={form.min_plausible}
                onChange={(e) => setForm({ ...form, min_plausible: e.target.value })}
              />
            </Field>
            <Field label="Max Plausible">
              <Input
                type="number"
                value={form.max_plausible}
                onChange={(e) => setForm({ ...form, max_plausible: e.target.value })}
              />
            </Field>
            <Field label="Normal Low">
              <Input
                type="number"
                value={form.normal_low}
                onChange={(e) => setForm({ ...form, normal_low: e.target.value })}
              />
            </Field>
            <Field label="Normal High">
              <Input
                type="number"
                value={form.normal_high}
                onChange={(e) => setForm({ ...form, normal_high: e.target.value })}
              />
            </Field>
            <Field label="Optimal Low">
              <Input
                type="number"
                value={form.optimal_low}
                onChange={(e) => setForm({ ...form, optimal_low: e.target.value })}
              />
            </Field>
            <Field label="Optimal High">
              <Input
                type="number"
                value={form.optimal_high}
                onChange={(e) => setForm({ ...form, optimal_high: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Display Order">
              <Input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="fasting, metabolic"
              />
            </Field>
          </div>

          <Field label="Add-on price (EGP)">
            <Input
              type="number"
              min={0}
              value={form.addon_price_egp}
              onChange={(e) => setForm({ ...form, addon_price_egp: e.target.value })}
              placeholder="Leave blank if not sold as an add-on"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Biomarker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
