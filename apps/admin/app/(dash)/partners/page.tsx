'use client';

import type { LabPartnerSummary, ServiceArea } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { AreaChip, Button, Card, EyebrowLabel, Field, Input, Spinner } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

export default function PartnersPage() {
  const { push } = useToast();
  const [partners, setPartners] = useState<LabPartnerSummary[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.partners(), api.areas()])
      .then(([p, a]) => {
        setPartners(p.partners);
        setAreas(a.areas);
      })
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps
  const err = (e: unknown) => push('error', e instanceof ApiError ? e.message : 'Failed');

  const create = async () => {
    if (!email || !name || password.length < 8) {
      return push('error', 'Name, email, and an 8+ char password are required');
    }
    setCreating(true);
    try {
      await api.createPartner({ email, full_name: name, password });
      push('success', 'Partner created');
      setEmail('');
      setName('');
      setPassword('');
      load();
    } catch (e) {
      err(e);
    } finally {
      setCreating(false);
    }
  };

  const toggleArea = async (p: LabPartnerSummary, areaId: string) => {
    const next = p.area_ids.includes(areaId)
      ? p.area_ids.filter((id) => id !== areaId)
      : [...p.area_ids, areaId];
    try {
      await api.assignPartnerAreas(p.id, { area_ids: next });
      load();
    } catch (e) {
      err(e);
    }
  };

  const remove = async (p: LabPartnerSummary) => {
    if (!confirm(`Remove lab partner "${p.full_name}"? Their account will be demoted to a regular user.`)) return;
    try {
      await api.deletePartner(p.id);
      push('success', 'Partner removed');
      load();
    } catch (e) {
      err(e);
    }
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Lab Partners</h1>
      <p className="mb-6 max-w-2xl text-sm text-inkSoft">
        Create lab partner accounts and assign them the service areas they cover. Partners sign in
        to the separate partner portal to see appointments and upload results.
      </p>

      <Card className="mb-6 p-4">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">New partner</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Full name">
            <Input className="w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cairo Labs" />
          </Field>
          <Field label="Email">
            <Input className="w-56" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ops@cairolabs.com" />
          </Field>
          <Field label="Temp password">
            <Input className="w-44" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 chars" />
          </Field>
          <Button onClick={create} disabled={creating}>
            {creating ? 'Creating…' : 'Create partner'}
          </Button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : partners.length === 0 ? (
        <div className="text-sm text-inkMuted">No lab partners yet.</div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-lg font-bold text-ink">{p.full_name}</div>
                  <div className="text-xs text-inkMuted">{p.email}</div>
                </div>
                <button onClick={() => remove(p)} className="text-sm text-rust hover:underline">
                  Remove
                </button>
              </div>
              <EyebrowLabel>Assigned areas</EyebrowLabel>
              <div className="flex flex-wrap gap-2">
                {areas.length === 0 ? (
                  <span className="text-sm text-inkMuted">No service areas exist yet.</span>
                ) : (
                  areas.map((a) => (
                    <AreaChip
                      key={a.id}
                      label={a.name}
                      selected={p.area_ids.includes(a.id)}
                      onClick={() => toggleArea(p, a.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
