'use client';

import {
  ageFromDateOfBirth,
  type Booking,
  type LabUpload,
  type NotificationTemplate,
  type ParsedLabRow,
  type PartnerUserDetail,
} from '@vital/shared';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { AlertsBell } from '@/components/AlertsBell';
import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  EyebrowLabel,
  Field,
  Input,
  LabelRow,
  SegmentedTabs,
  Select,
  Spinner,
  StatusPill,
} from '@/components/ui';
import { ApiError, api, type BiomarkerOption } from '@/lib/api';

/** Build a Google Maps directions URL — prefers exact coords, falls back to the address. */
function mapsUrl(appointment: Booking): string | null {
  if (appointment.latitude != null && appointment.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${appointment.latitude},${appointment.longitude}`;
  }
  if (appointment.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.address)}`;
  }
  return null;
}

export default function AppointmentDetailPage() {
  // useSearchParams must sit under a Suspense boundary for the production build.
  return (
    <Suspense fallback={<Spinner />}>
      <AppointmentDetail />
    </Suspense>
  );
}

const TABS = [
  { value: 'details' as const, label: 'Details' },
  { value: 'upload' as const, label: 'Upload Results' },
];

function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const userId = params.id;
  const bookingId = search.get('booking');
  const { push } = useToast();

  const [detail, setDetail] = useState<PartnerUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'details' | 'upload'>('details');

  const load = () => {
    setLoading(true);
    api
      .userDetail(userId)
      .then(setDetail)
      .catch((e) => push('error', e instanceof ApiError ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const appointment: Booking | null = useMemo(() => {
    if (!detail) return null;
    return (
      detail.appointments.find((b) => b.id === bookingId) ??
      detail.appointments.find((b) => b.status === 'booked') ??
      detail.appointments[0] ??
      null
    );
  }, [detail, bookingId]);

  if (loading) return <Spinner />;
  if (!detail) return <div className="text-sm text-inkMuted">Patient not found.</div>;

  const { user, plan } = detail;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          ← Appointments
        </Link>
        <AlertsBell />
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">{user.full_name}</h1>
        {/* Tabs next to the patient name */}
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'details' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 1a. Patient details */}
          <Card className="p-5">
            <EyebrowLabel>Patient</EyebrowLabel>
            <LabelRow label="Name" value={user.full_name} />
            <LabelRow label="Email" value={user.email} copyable />
            <LabelRow label="Phone" value={user.phone ?? '—'} copyable />
            <LabelRow label="Date of birth" value={user.date_of_birth ?? '—'} />
            <LabelRow
              label="Age"
              value={
                user.date_of_birth
                  ? `${ageFromDateOfBirth(user.date_of_birth) ?? '—'} yrs`
                  : '—'
              }
            />
            <LabelRow label="Height" value={user.height_cm != null ? `${user.height_cm} cm` : '—'} />
            <LabelRow label="Gender" value={user.gender ?? '—'} />
          </Card>

          {/* 1b. Lab tests required (from subscription plan) */}
          <Card className="p-5">
            <EyebrowLabel>Lab tests required</EyebrowLabel>
            {plan ? (
              <>
                <LabelRow label="Plan" value={plan.name} />
                <LabelRow label="Biomarkers" value={`${plan.biomarker_count} markers`} />
                <LabelRow label="Annual tests" value={String(plan.annual_tests_count)} />
                {plan.features.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-inkSoft">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-inkMuted">No active subscription plan.</div>
            )}

            {/* Extra paid markers bought for this visit (out-of-plan add-ons). */}
            {(() => {
              const extras = (detail.addon_orders ?? [])
                .filter((o) => o.booking_id === appointment?.id)
                .flatMap((o) => o.items);
              if (extras.length === 0) return null;
              return (
                <div className="mt-4 border-t border-line pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-rust">
                    Extra tests (paid add-ons)
                  </div>
                  <ul className="mt-2 space-y-1">
                    {extras.map((it, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-ink">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {it.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </Card>

          {/* 1c. Scheduled appointment */}
          <Card className="p-5">
            <EyebrowLabel>Scheduled appointment</EyebrowLabel>
            {appointment ? (
              <>
                <LabelRow label="Date" value={appointment.date} />
                <LabelRow label="Time" value={`${appointment.start_time}–${appointment.end_time}`} />
                <LabelRow label="Area" value={appointment.area_name} />
                <LabelRow label="Address" value={appointment.address ?? '—'} copyable />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusPill
                    status={
                      appointment.status === 'booked'
                        ? 'active'
                        : appointment.status === 'cancelled'
                          ? 'expired'
                          : 'cancelled'
                    }
                  />
                  {mapsUrl(appointment) ? (
                    <a
                      href={mapsUrl(appointment) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent/90"
                    >
                      ↗ Navigate in Google Maps
                    </a>
                  ) : null}
                </div>
                {appointment.latitude != null && appointment.longitude != null ? (
                  <p className="mt-2 text-xs text-inkMuted">
                    Pinned location: {appointment.latitude.toFixed(5)}, {appointment.longitude.toFixed(5)}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-inkMuted">No appointment found.</div>
            )}
          </Card>

          {/* 2. Notify patient — preset visit notifications (admin-managed) */}
          <NotifyCard userId={userId} className="md:col-span-2" />

          {/* 1d. Notes */}
          <Card className="p-5">
            <EyebrowLabel>Notes</EyebrowLabel>
            <p className="text-sm leading-relaxed text-ink">
              {appointment?.notes?.trim() || 'No notes provided.'}
            </p>
            <div className="mt-4 border-t border-line pt-3 text-xs text-inkMuted">
              {detail.results.length} result(s) on file · {detail.lab_uploads.length} upload(s)
            </div>
          </Card>
        </div>
      ) : (
        <UploadTab userId={userId} defaultTestedAt={appointment?.date} onImported={load} />
      )}
    </div>
  );
}

/**
 * Notify-patient card: lists the admin-managed visit-notification presets as
 * buttons. Tapping one pushes that message to the patient (in-app feed + push)
 * — e.g. "Your VITAL doctor is on the way and will arrive within 30 minutes."
 */
function NotifyCard({ userId, className = '' }: { userId: string; className?: string }) {
  const { push } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .notificationTemplates()
      .then((r) => setTemplates(r.templates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const send = async (t: NotificationTemplate) => {
    setSendingId(t.id);
    try {
      await api.notify(userId, t.id);
      push('success', `Sent “${t.title}” to the patient`);
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed to send');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Card className={`p-5 ${className}`}>
      <EyebrowLabel>Notify patient</EyebrowLabel>
      <p className="mb-3 text-sm text-inkSoft">
        Send a preset update to the patient before you arrive. They receive it as a push
        notification and in their app.
      </p>
      {loading ? (
        <div className="text-sm text-inkMuted">Loading messages…</div>
      ) : templates.length === 0 ? (
        <div className="text-sm text-inkMuted">
          No message presets yet. An admin can add them in the dashboard.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => send(t)}
              disabled={sendingId !== null}
              className="rounded-lg border border-line bg-card px-4 py-3 text-left transition hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{t.title}</span>
                <span className="shrink-0 text-xs text-accent">
                  {sendingId === t.id ? 'Sending…' : 'Send →'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-inkSoft">{t.body}</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

interface ReviewRow extends ParsedLabRow {
  _value: string;
}

// Low-confidence rows are tinted amber so the partner verifies them.
const confTint = (c: number) =>
  c < 0.6
    ? { backgroundColor: 'rgba(205,162,78,.12)', borderColor: 'rgba(205,162,78,.30)' }
    : c < 0.75
      ? { backgroundColor: 'rgba(205,162,78,.06)', borderColor: 'rgba(205,162,78,.20)' }
      : { borderColor: '#E7DECC' };
const confColor = (c: number) =>
  c < 0.6 ? 'text-amber font-medium' : c < 0.75 ? 'text-amber/80' : 'text-inkMuted';
const confLabel = (c: number) => {
  const p = Math.round(c * 100);
  return c < 0.6 ? `${p}% — low` : `${p}%`;
};

function UploadTab({
  userId,
  defaultTestedAt,
  onImported,
}: {
  userId: string;
  defaultTestedAt?: string;
  onImported: () => void;
}) {
  const { push } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [labName, setLabName] = useState('');
  const [testedAt, setTestedAt] = useState(defaultTestedAt ?? today);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<LabUpload | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [catalog, setCatalog] = useState<BiomarkerOption[]>([]);

  useEffect(() => {
    api.biomarkers().then((r) => setCatalog(r.biomarkers)).catch(() => {});
  }, []);
  const unitFor = (id: string | null) => catalog.find((b) => b.id === id)?.unit ?? '';

  const err = (e: unknown) => push('error', e instanceof ApiError ? e.message : 'Failed');

  const doUpload = async () => {
    if (!file) return push('error', 'Choose a PDF first');
    setBusy(true);
    try {
      const { upload } = await api.uploadLab(userId, file, {
        lab_name: labName || undefined,
        tested_at: testedAt || undefined,
      });
      setUpload(upload);
      setRows(upload.parsed.map((p) => ({ ...p, _value: p.value != null ? String(p.value) : '' })));
      if (upload.parsed.length === 0) push('info', 'Stored, but no values could be auto-detected');
      else push('success', `Parsed ${upload.parsed.length} values — review to import`);
    } catch (e) {
      err(e);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!upload) return;
    const importable = rows.filter((r) => r.include && r.biomarker_id && r._value !== '');
    if (importable.length === 0) return push('error', 'Select at least one matched result to import');
    setBusy(true);
    try {
      const { imported } = await api.confirmLab(upload.id, {
        tested_at: testedAt,
        lab_name: labName || undefined,
        rows: importable.map((r) => ({
          biomarker_id: r.biomarker_id as string,
          value: Number(r._value),
          include: true,
        })),
      });
      push('success', `Imported ${imported} result(s) — the patient has been notified`);
      setUpload(null);
      setRows([]);
      setFile(null);
      onImported();
    } catch (e) {
      err(e);
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = rows.filter((r) => r.include && r.biomarker_id && r._value !== '').length;

  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Lab PDF">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-inkSoft file:mr-3 file:rounded-lg file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-inkSoft hover:file:bg-line"
          />
        </Field>
        <Field label="Lab name">
          <Input className="w-44" value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Cairo Labs" />
        </Field>
        <Field label="Test date">
          <Input type="date" className="w-44" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} />
        </Field>
        <Button variant="outline" onClick={doUpload} disabled={busy || !file}>
          {busy && !upload ? 'Uploading…' : 'Upload & parse'}
        </Button>
      </div>

      {!upload ? (
        <p className="text-xs italic text-inkMuted">
          Select a PDF, then click &quot;Upload &amp; parse&quot; to review extracted values.
        </p>
      ) : rows.length > 0 ? (
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Review parsed results</h3>
              <p className="mt-0.5 text-xs text-inkMuted">
                Remap rows with the dropdown; uncheck what you don&apos;t want to import. Amber rows
                have low match confidence — verify against the source PDF.
              </p>
            </div>
            {upload.file_url ? (
              <a
                href={upload.file_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs text-accent hover:underline"
              >
                View source PDF ↗
              </a>
            ) : null}
          </div>
          <div className="space-y-1.5">
            {rows.map((r, i) => {
              const mapped = Boolean(r.biomarker_id);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition"
                  style={confTint(r.confidence)}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed"
                    disabled={!mapped || r._value === ''}
                    checked={r.include && mapped}
                    onChange={(e) =>
                      setRows(rows.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <Select
                      value={r.biomarker_id ?? ''}
                      onChange={(e) =>
                        setRows(
                          rows.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  biomarker_id: e.target.value || null,
                                  include: Boolean(e.target.value) && x._value !== '',
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">— unmatched: pick a biomarker —</option>
                      {catalog.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                    <div className="mt-0.5 text-xs text-inkMuted">
                      from PDF: <span className="font-medium">{r.biomarker_name}</span>
                      {r.reference_range ? (
                        <span className="ml-2 text-inkMuted">· lab range: {r.reference_range}</span>
                      ) : null}
                    </div>
                  </div>
                  <Input
                    className="w-24 text-right tabular-nums"
                    value={r._value}
                    onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, _value: e.target.value } : x)))}
                  />
                  <span className="w-12 shrink-0 text-xs text-inkMuted">{unitFor(r.biomarker_id)}</span>
                  <span className={`w-24 shrink-0 text-right text-xs ${confColor(r.confidence)}`}>
                    {confLabel(r.confidence)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="text-xs text-inkMuted">
              {selectedCount} of {rows.length} selected
            </span>
            <Button className="px-6" onClick={confirm} disabled={busy || selectedCount === 0}>
              {busy ? 'Importing…' : 'Import selected'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs italic text-inkMuted">No values could be auto-detected in that PDF.</p>
      )}
    </Card>
  );
}
