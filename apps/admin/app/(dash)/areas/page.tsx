'use client';

import type {
  AvailabilityOverride,
  AvailabilityWindow,
  OverrideWindow,
  ServiceArea,
} from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AreasPage() {
  const { push } = useToast();
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const loadAreas = () => {
    setLoading(true);
    api.areas().then((r) => setAreas(r.areas)).catch((e) => push('error', e.message)).finally(() => setLoading(false));
  };
  useEffect(loadAreas, []); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (e: unknown) => push('error', e instanceof ApiError ? e.message : 'Failed');

  const addArea = async () => {
    const name = prompt('Area name (e.g. New Cairo)');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await api.createArea({ name, slug, city: '', default_slot_minutes: 60, is_active: true, display_order: areas.length + 1 });
      push('success', 'Area added');
      loadAreas();
    } catch (e) { err(e); }
  };

  const updateArea = async (a: ServiceArea, patch: Partial<ServiceArea>) => {
    try {
      await api.updateArea(a.id, {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.default_slot_minutes !== undefined ? { default_slot_minutes: patch.default_slot_minutes } : {}),
        ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
      });
      loadAreas();
    } catch (e) { err(e); }
  };

  const removeArea = async (a: ServiceArea) => {
    if (!confirm(`Delete area "${a.name}" and all its slots?`)) return;
    try { await api.deleteArea(a.id); push('success', 'Deleted'); if (selected === a.id) setSelected(null); loadAreas(); } catch (e) { err(e); }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Booking Areas</h1>
        <Button onClick={addArea}>Add area</Button>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-inkSoft">
        Each area has its own weekly windows and capacity. Per-window length is flexible; the
        default below is just a convenience when adding windows.
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {areas.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-display text-lg font-bold text-ink">{a.name}</div>
                <Field label="City">
                  <Input className="w-40" defaultValue={a.city} onBlur={(e) => e.target.value !== a.city && updateArea(a, { city: e.target.value })} />
                </Field>
                <Field label="Default window (min)">
                  <Select value={a.default_slot_minutes} onChange={(e) => updateArea(a, { default_slot_minutes: Number(e.target.value) })}>
                    {[60, 120, 180].map((m) => <option key={m} value={m}>{m} ({m / 60}h)</option>)}
                  </Select>
                </Field>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={a.is_active} onChange={(e) => updateArea(a, { is_active: e.target.checked })} />
                  Active
                </label>
                <div className="ml-auto flex gap-3">
                  <button onClick={() => setSelected(selected === a.id ? null : a.id)} className="text-sm text-greenInk hover:underline">
                    {selected === a.id ? 'Hide schedule' : 'Edit schedule'}
                  </button>
                  <button onClick={() => removeArea(a)} className="text-sm text-rust hover:underline">Delete</button>
                </div>
              </div>
              {selected === a.id ? <AreaSchedule area={a} /> : null}
            </Card>
          ))}
          {areas.length === 0 ? <div className="text-sm text-inkMuted">No areas yet.</div> : null}
        </div>
      )}
    </div>
  );
}

function AreaSchedule({ area }: { area: ServiceArea }) {
  const { push } = useToast();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [day, setDay] = useState(0);
  const [start, setStart] = useState('12:00');
  const [cap, setCap] = useState(5);

  const dur = area.default_slot_minutes;
  const endFor = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    const t = (h! * 60 + m! + dur) % (24 * 60);
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  };

  const load = () => {
    api.windows(area.id).then((r) => setWindows(r.windows)).catch(() => {});
    api.overrides(area.id).then((r) => setOverrides(r.overrides)).catch(() => {});
  };
  useEffect(load, [area.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = (e: unknown) => push('error', e instanceof ApiError ? e.message : 'Failed');

  const addWindow = async () => {
    try {
      await api.createWindow(area.id, { day_of_week: day, start_time: start, end_time: endFor(start), capacity: cap });
      push('success', 'Window added');
      load();
    } catch (e) { err(e); }
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h4 className="mb-2 font-display text-sm font-bold text-ink">Weekly windows</h4>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Field label="Day"><Select value={day} onChange={(e) => setDay(Number(e.target.value))}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</Select></Field>
        <Field label="Start"><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End"><Input value={endFor(start)} disabled /></Field>
        <Field label="Capacity"><Input className="w-24" type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} /></Field>
        <Button onClick={addWindow}>Add</Button>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {windows.map((w) => (
          <div key={w.id} className="flex items-center justify-between rounded border border-line px-3 py-1.5 text-sm">
            <span className="text-ink">{DAYS[w.day_of_week]} · {w.start_time}–{w.end_time}</span>
            <span className="flex items-center gap-3">
              <span className="text-inkMuted">{w.capacity} slots</span>
              <button onClick={async () => { try { await api.deleteWindow(w.id); load(); } catch (e) { err(e); } }} className="text-rust hover:underline">×</button>
            </span>
          </div>
        ))}
        {windows.length === 0 ? <div className="text-sm text-inkMuted">No windows. Add one above.</div> : null}
      </div>

      <OverridesEditor area={area} overrides={overrides} onChange={load} />
    </div>
  );
}

function OverridesEditor({
  area,
  overrides,
  onChange,
}: {
  area: ServiceArea;
  overrides: AvailabilityOverride[];
  onChange: () => void;
}) {
  const { push } = useToast();
  const [date, setDate] = useState('');
  const [closed, setClosed] = useState(true);
  const [custom, setCustom] = useState<OverrideWindow[]>([]);
  const err = (e: unknown) => push('error', e instanceof ApiError ? e.message : 'Failed');

  const save = async () => {
    if (!date) return push('error', 'Pick a date');
    try {
      await api.saveOverride(area.id, { date, is_closed: closed, windows: closed ? null : custom });
      push('success', 'Override saved');
      setDate(''); setCustom([]); setClosed(true);
      onChange();
    } catch (e) { err(e); }
  };

  return (
    <div className="mt-5">
      <h4 className="mb-2 font-display text-sm font-bold text-ink">Date overrides</h4>
      <div className="mb-2 flex flex-wrap items-end gap-2">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} /> Closed all day
        </label>
        {!closed ? (
          <Button variant="ghost" onClick={() => setCustom([...custom, { start_time: '12:00', end_time: '13:00', capacity: 5 }])}>+ window</Button>
        ) : null}
        <Button onClick={save}>Save override</Button>
      </div>
      {!closed && custom.map((w, i) => (
        <div key={i} className="mb-1 flex items-end gap-2">
          <Input type="time" value={w.start_time} onChange={(e) => setCustom(custom.map((x, j) => j === i ? { ...x, start_time: e.target.value } : x))} />
          <Input type="time" value={w.end_time} onChange={(e) => setCustom(custom.map((x, j) => j === i ? { ...x, end_time: e.target.value } : x))} />
          <Input className="w-24" type="number" value={w.capacity} onChange={(e) => setCustom(custom.map((x, j) => j === i ? { ...x, capacity: Number(e.target.value) } : x))} />
          <button onClick={() => setCustom(custom.filter((_, j) => j !== i))} className="pb-2 text-rust">×</button>
        </div>
      ))}
      <div className="grid gap-1 sm:grid-cols-2">
        {overrides.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded border border-line px-3 py-1.5 text-sm">
            <span className="text-ink">{o.date} · {o.is_closed ? 'Closed' : `${o.windows?.length ?? 0} window(s)`}</span>
            <button onClick={async () => { try { await api.deleteOverride(o.id); onChange(); } catch (e) { err(e); } }} className="text-rust hover:underline">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
