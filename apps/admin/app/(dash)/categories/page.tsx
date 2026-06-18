'use client';

import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/toast';
import {
  Button,
  Field,
  Input,
  Modal,
  Spinner,
  Table,
  Td,
  Th,
  Textarea,
  EmptyRow,
} from '@/components/ui';
import type { BiomarkerCategory } from '@vital/shared';

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#4CAF84',
  display_order: '0',
};

export default function CategoriesPage() {
  const { push } = useToast();
  const [categories, setCategories] = useState<BiomarkerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.categories();
      setCategories(res.categories);
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(cat: BiomarkerCategory) {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      display_order: String(cat.display_order),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      icon: form.icon,
      color: form.color,
      display_order: Number(form.display_order),
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updateCategory(editing, payload);
      } else {
        await api.createCategory(payload);
      }
      setModalOpen(false);
      push('success', editing ? 'Category updated' : 'Category created');
      await load();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: BiomarkerCategory) {
    if (!confirm(`Delete the "${cat.name}" category?`)) return;
    try {
      await api.deleteCategory(cat.id);
      push('success', 'Category deleted');
      await load();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to delete category');
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Categories</h1>
        <Button onClick={openCreate}>Add Category</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          head={
            <>
              <Th>Color</Th>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Icon</Th>
              <Th>Order</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
        >
          {categories.length === 0 ? (
            <EmptyRow colSpan={6} label="No categories yet" />
          ) : (
            categories.map((cat) => (
              <tr key={cat.id} className="border-b border-line last:border-0">
                <Td>
                  <span
                    className="inline-block h-5 w-5 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                </Td>
                <Td className="font-medium text-ink">{cat.name}</Td>
                <Td className="text-inkSoft">{cat.slug}</Td>
                <Td className="text-inkSoft">{cat.icon}</Td>
                <Td>{cat.display_order}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => openEdit(cat)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(cat)}>
                      Delete
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
        title={editing ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Icon (Lucide name)">
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="e.g. activity"
            />
          </Field>
          <Field label="Color (hex)">
            <div className="flex items-center gap-3">
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="#4CAF84"
              />
              <span
                className="inline-block h-9 w-9 flex-shrink-0 rounded border border-line"
                style={{ backgroundColor: form.color }}
              />
            </div>
          </Field>
          <Field label="Display Order">
            <Input
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
