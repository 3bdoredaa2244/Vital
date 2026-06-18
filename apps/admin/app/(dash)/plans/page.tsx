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
import type { SubscriptionPlan } from '@vital/shared';

interface FormState {
  name: 'basic' | 'premium';
  price_egp: string;
  price_display: string;
  annual_tests_count: string;
  biomarker_count: string;
  features: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: 'basic',
  price_egp: '0',
  price_display: '',
  annual_tests_count: '0',
  biomarker_count: '0',
  features: '',
  is_active: true,
};

export default function PlansPage() {
  const { push } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.plans();
      setPlans(res.plans);
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to load plans');
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

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan.id);
    setForm({
      name: plan.name,
      price_egp: String(plan.price_egp),
      price_display: plan.price_display,
      annual_tests_count: String(plan.annual_tests_count),
      biomarker_count: String(plan.biomarker_count),
      features: plan.features.join('\n'),
      is_active: plan.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price_egp);
    if (price < 0) {
      push('error', 'Price must be at least 0');
      return;
    }
    const payload = {
      name: form.name,
      price_egp: price,
      price_display: form.price_display,
      annual_tests_count: Number(form.annual_tests_count),
      biomarker_count: Number(form.biomarker_count),
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0),
      is_active: form.is_active,
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updatePlan(editing, payload);
      } else {
        await api.createPlan(payload);
      }
      setModalOpen(false);
      push('success', editing ? 'Plan updated' : 'Plan created');
      await load();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(plan: SubscriptionPlan) {
    if (!confirm(`Deactivate the "${plan.price_display}" plan?`)) return;
    try {
      await api.deletePlan(plan.id);
      push('success', 'Plan deactivated');
      await load();
    } catch (err) {
      push('error', err instanceof ApiError ? err.message : 'Failed to deactivate plan');
    }
  }

  return (
    <div>
      <PageHd title="Plans" sub="Subscription tiers and pricing.">
        <Button onClick={openCreate}>Add Plan</Button>
      </PageHd>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          head={
            <>
              <Th>Name</Th>
              <Th>Price</Th>
              <Th>Display</Th>
              <Th>Tests / yr</Th>
              <Th>Biomarkers</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
        >
          {plans.length === 0 ? (
            <EmptyRow colSpan={7} label="No plans yet" />
          ) : (
            plans.map((plan) => (
              <tr key={plan.id} className="border-b border-line last:border-0">
                <Td className="font-medium capitalize text-ink">{plan.name}</Td>
                <Td>{plan.price_egp.toLocaleString('en-US')} EGP</Td>
                <Td className="text-inkSoft">{plan.price_display}</Td>
                <Td>{plan.annual_tests_count}</Td>
                <Td>{plan.biomarker_count}</Td>
                <Td>
                  <StatusPill status={plan.is_active ? 'active' : 'expired'} />
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => openEdit(plan)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeactivate(plan)}>
                      Deactivate
                    </Button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <Select
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value as 'basic' | 'premium' })}
            >
              <option value="basic">basic</option>
              <option value="premium">premium</option>
            </Select>
          </Field>
          <Field label="Price (EGP)">
            <Input
              type="number"
              min={0}
              value={form.price_egp}
              onChange={(e) => setForm({ ...form, price_egp: e.target.value })}
            />
          </Field>
          <Field label="Price Display">
            <Input
              value={form.price_display}
              onChange={(e) => setForm({ ...form, price_display: e.target.value })}
              placeholder="e.g. 3,500 EGP / year"
            />
          </Field>
          <Field label="Annual Tests Count">
            <Input
              type="number"
              min={0}
              value={form.annual_tests_count}
              onChange={(e) => setForm({ ...form, annual_tests_count: e.target.value })}
            />
          </Field>
          <Field label="Biomarker Count">
            <Input
              type="number"
              min={0}
              value={form.biomarker_count}
              onChange={(e) => setForm({ ...form, biomarker_count: e.target.value })}
            />
          </Field>
          <Field label="Features (one per line)">
            <Textarea
              rows={4}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={'Annual blood panel\nQuarterly check-ins'}
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
