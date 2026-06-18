'use client';

import type { AdminUserDetail, AiInsight, Biomarker, LabUpload, ParsedLabRow, RecommendedIntervention, SubscriptionPlan } from '@vital/shared';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  EmptyRow,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  StatusPill,
  Table,
  Td,
  Th,
  PageHd,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';

const today = () => new Date().toISOString().slice(0, 10);

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useToast();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [review, setReview] = useState<LabUpload | null>(null);

  const bmById = useMemo(() => new Map(biomarkers.map((b) => [b.id, b])), [biomarkers]);

  const load = async () => {
    try {
      const [d, b, p] = await Promise.all([api.user(id), api.biomarkers(), api.plans()]);
      setDetail(d);
      setBiomarkers(b.biomarkers);
      setPlans(p.plans);
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner />;
  if (!detail) return <div className="text-inkSoft">User not found.</div>;

  const { user, subscription, results, lab_uploads, score } = detail;

  const deleteResult = async (rid: string) => {
    if (!confirm('Delete this result?')) return;
    try {
      await api.deleteResult(rid);
      push('success', 'Result deleted');
      void load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm('Cancel this subscription? The user will lose access to biomarker data.')) return;
    try {
      await api.updateSubscription(subscription.id, { status: 'cancelled' });
      push('success', 'Subscription cancelled');
      void load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const openReview = async (uploadId: string) => {
    try {
      const { upload } = await api.labUpload(uploadId);
      setReview(upload);
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed to open upload');
    }
  };

  return (
    <div>
      <a href="/users" className="mb-2 inline-block text-sm text-accent hover:underline">← All users</a>
      <PageHd title={user.full_name} sub={`${user.email}${user.phone ? ` · ${user.phone}` : ''}`}>
        <Button variant="outline" onClick={() => setEditOpen(true)}>Edit profile</Button>
      </PageHd>

      {/* Profile + subscription */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-ink">Profile</h3>
          <dl className="space-y-2 text-sm">
            <Row k="Role" v={user.role} />
            <Row k="Date of birth" v={user.date_of_birth ?? '—'} />
            <Row k="Gender" v={user.gender ?? '—'} />
            <Row k="Height / Weight" v={`${user.height_cm ?? '—'} cm · ${user.weight_kg ?? '—'} kg`} />
            <Row k="Goals" v={user.health_goals.length ? user.health_goals.join(', ') : '—'} />
            <Row k="Conditions" v={user.chronic_conditions.length ? user.chronic_conditions.join(', ') : '—'} />
          </dl>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">Subscription</h3>
            <div className="flex gap-3">
              {subscription ? (
                <>
                  <button onClick={() => setSubOpen(true)} className="text-sm text-greenInk hover:underline">Edit</button>
                  {subscription.status === 'active' ? (
                    <button onClick={cancelSubscription} className="text-sm text-rust hover:underline">Cancel</button>
                  ) : null}
                </>
              ) : (
                <button onClick={() => setSubOpen(true)} className="text-sm text-greenInk hover:underline">Grant</button>
              )}
            </div>
          </div>
          {subscription ? (
            <dl className="space-y-2 text-sm">
              <Row k="Plan" v={subscription.plan.name} />
              <Row k="Status" v={<StatusPill status={subscription.status} />} />
              <Row k="Started" v={new Date(subscription.started_at).toLocaleDateString('en-GB')} />
              <Row k="Expires" v={new Date(subscription.expires_at).toLocaleDateString('en-GB')} />
            </dl>
          ) : (
            <div className="text-inkMuted">No subscription.</div>
          )}
        </Card>
      </div>

      {/* VITAL Score (lab-only health model) */}
      {score && score.tested_count > 0 ? (
        <Card className="mt-4 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">VITAL Score</h3>
              <div className="mt-1 text-sm text-inkSoft">
                {score.tested_count} of {score.total_count} markers tested · confidence{' '}
                {score.confidence}%
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-extrabold text-ink">{score.score}</div>
              <div className="text-xs uppercase tracking-wide text-inkMuted">{score.band}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Biological age" value={score.biological_age} hint={
              score.age_delta != null && score.age_delta !== 0
                ? `${score.age_delta < 0 ? '−' : '+'}${Math.abs(score.age_delta)}y vs ${score.chronological_age}`
                : score.chronological_age != null ? `chrono ${score.chronological_age}` : undefined
            } />
            <Metric label="Cardiometabolic" value={score.cardiometabolic_score} />
            <Metric label="Longevity" value={score.longevity_score} />
            <Metric label="Confidence" value={score.confidence} suffix="%" />
          </div>

          {score.phenoage ? (
            <div className="mt-3 text-xs text-inkMuted">
              PhenoAge: {score.phenoage.markers_used}/{score.phenoage.markers_total} markers used
              {score.phenoage.imputed.length > 0
                ? ` · imputed: ${score.phenoage.imputed.join(', ')}`
                : ''}{' '}
              · 10-yr mortality {(score.phenoage.mortality_risk_10yr * 100).toFixed(1)}%
            </div>
          ) : (
            <div className="mt-3 text-xs text-inkMuted">
              Biological age unavailable — needs ≥4 of the 9 PhenoAge markers.
            </div>
          )}

          {score.category_scores.filter((c) => c.tested > 0).length > 0 ? (
            <div className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
              {score.category_scores
                .filter((c) => c.tested > 0)
                .map((c) => (
                  <div key={c.slug} className="flex items-center justify-between text-sm">
                    <span className="text-inkSoft">{c.name}</span>
                    <span className="font-medium text-ink">
                      {c.score} <span className="text-inkMuted">({c.tested}/{c.total})</span>
                    </span>
                  </div>
                ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* AI insights */}
      <UserAiCard userId={id} />

      {/* Recommendations */}
      <UserRecsCard userId={id} />

      {/* Lab upload */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold text-ink">Lab results</h2>
        <LabUploadCard userId={id} onUploaded={(u) => { setReview(u); void load(); }} />
      </div>

      {/* Upload history */}
      {lab_uploads.length > 0 ? (
        <Card className="mt-4 divide-y divide-line">
          {lab_uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-ink">{u.original_name}</div>
                <div className="text-xs text-inkMuted">
                  {new Date(u.created_at).toLocaleDateString('en-GB')} · {u.parsed.length} parsed · {u.result_count} imported
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={u.status === 'confirmed' ? 'active' : u.status === 'failed' ? 'cancelled' : 'expired'} />
                {u.status === 'parsed' ? (
                  <Button variant="outline" onClick={() => openReview(u.id)}>Review</Button>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      {/* Results table */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">Recorded values</h2>
        <Button onClick={() => setAddOpen(true)}>Add result</Button>
      </div>
      <div className="mt-3">
        <Table head={<><Th>Biomarker</Th><Th>Value</Th><Th>Tested</Th><Th>Source</Th><Th>Lab</Th><Th /></>}>
          {results.length === 0 ? (
            <EmptyRow colSpan={6} label="No results recorded yet." />
          ) : (
            results.map((r) => {
              const bm = bmById.get(r.biomarker_id);
              return (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <Td className="font-medium text-ink">{bm?.name ?? r.biomarker_id}</Td>
                  <Td>{r.value} {bm?.unit ?? ''}</Td>
                  <Td className="text-inkSoft">{r.tested_at}</Td>
                  <Td className="text-inkMuted capitalize">{r.source.replace('_', ' ')}</Td>
                  <Td className="text-inkSoft">{r.lab_name ?? '—'}</Td>
                  <Td><button onClick={() => deleteResult(r.id)} className="text-sm text-rust hover:underline">Delete</button></Td>
                </tr>
              );
            })
          )}
        </Table>
      </div>

      {editOpen ? (
        <EditProfileModal detail={detail} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); void load(); }} />
      ) : null}
      {addOpen ? (
        <AddResultModal userId={id} biomarkers={biomarkers} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); void load(); }} />
      ) : null}
      {review ? (
        <ReviewModal upload={review} biomarkers={biomarkers} onClose={() => setReview(null)} onConfirmed={() => { setReview(null); void load(); }} />
      ) : null}
      {subOpen ? (
        <SubscriptionModal
          userId={id}
          plans={plans}
          current={subscription}
          onClose={() => setSubOpen(false)}
          onSaved={() => { setSubOpen(false); void load(); }}
        />
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-inkMuted">{k}</dt>
      <dd className="font-medium capitalize text-ink">{v}</dd>
    </div>
  );
}

function UserAiCard({ userId }: { userId: string }) {
  const { push } = useToast();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .aiInsights({ userId })
      .then((r) => setInsights(r.insights))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setBusy(true);
    try {
      const r = await api.generateUserInsights(userId);
      push('success', `Generated ${r.generated} insight(s)${r.pending_review ? ' (pending review)' : ''}`);
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      push('success', ok);
      load();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  return (
    <Card className="mt-4 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-ink">AI insights</h3>
        <Button variant="outline" onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : 'Generate'}
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-inkSoft">Loading…</div>
      ) : insights.length === 0 ? (
        <div className="text-sm text-inkMuted">No insights yet. Generate to create a summary &amp; protocol.</div>
      ) : (
        <div className="space-y-3">
          {insights.map((i) => (
            <div key={i.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-ink">{i.title}</div>
                  <div className="text-xs capitalize text-inkMuted">{i.type} · {i.status} · {i.source}</div>
                </div>
                <div className="flex gap-3">
                  {i.status !== 'published' ? (
                    <button onClick={() => act(() => api.publishInsight(i.id), 'Published')} className="text-sm text-greenInk hover:underline">Publish</button>
                  ) : null}
                  {i.status !== 'archived' ? (
                    <button onClick={() => act(() => api.archiveInsight(i.id), 'Archived')} className="text-sm text-amber hover:underline">Archive</button>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-inkSoft">{i.body}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UserRecsCard({ userId }: { userId: string }) {
  const [recs, setRecs] = useState<RecommendedIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .userRecommendations(userId)
      .then((r) => setRecs(r.recommendations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Card className="mt-4 p-5">
      <h3 className="mb-3 font-display text-lg font-bold text-ink">Recommendations</h3>
      {loading ? (
        <div className="text-sm text-inkSoft">Loading…</div>
      ) : recs.length === 0 ? (
        <div className="text-sm text-inkMuted">No interventions triggered by this user&apos;s results.</div>
      ) : (
        <div className="space-y-2">
          {recs.map(({ intervention: iv, matched }) => (
            <div key={iv.id} className="flex items-start justify-between rounded-lg border border-line p-3">
              <div>
                <div className="font-medium text-ink">{iv.name}</div>
                <div className="text-xs capitalize text-inkMuted">{iv.category} · {iv.evidence_level} evidence</div>
              </div>
              <div className="text-right text-xs text-inkSoft">{matched.map((m) => m.name).join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  hint,
  suffix,
}: {
  label: string;
  value: number | null;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-3">
      <div className="font-display text-2xl font-bold text-ink">
        {value == null ? '—' : `${value}${suffix ?? ''}`}
      </div>
      <div className="text-xs text-inkSoft">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-inkMuted">{hint}</div> : null}
    </div>
  );
}

// ── Lab upload card ──────────────────────────────────────────────────────────
function LabUploadCard({ userId, onUploaded }: { userId: string; onUploaded: (u: LabUpload) => void }) {
  const { push } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [labName, setLabName] = useState('');
  const [testedAt, setTestedAt] = useState(today());
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file) return push('error', 'Choose a PDF first');
    setBusy(true);
    try {
      const { upload } = await api.uploadLab(userId, file, { lab_name: labName || undefined, tested_at: testedAt });
      if (upload.parsed.length === 0) {
        push('info', 'Stored, but no values could be auto-detected — add results manually.');
      } else {
        push('success', `Parsed ${upload.parsed.length} values — review to import`);
      }
      setFile(null);
      onUploaded(upload);
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Lab PDF">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-inkSoft file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:text-canvas"
          />
        </Field>
        <Field label="Lab name"><Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Al Borg" /></Field>
        <Field label="Test date"><Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        <Button onClick={upload} disabled={busy || !file}>{busy ? 'Uploading & parsing…' : 'Upload & parse'}</Button>
      </div>
    </Card>
  );
}

// ── Review parsed rows ───────────────────────────────────────────────────────
function ReviewModal({
  upload,
  biomarkers,
  onClose,
  onConfirmed,
}: {
  upload: LabUpload;
  biomarkers: Biomarker[];
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const { push } = useToast();
  const bmById = useMemo(() => new Map(biomarkers.map((b) => [b.id, b])), [biomarkers]);
  const [rows, setRows] = useState<ParsedLabRow[]>(upload.parsed);
  const [labName, setLabName] = useState(upload.lab_name ?? '');
  const [testedAt, setTestedAt] = useState(upload.tested_at ?? today());
  const [busy, setBusy] = useState(false);

  const setRow = (i: number, patch: Partial<ParsedLabRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Biomarker options for remapping a mis-matched (or manually added) row.
  const bmOptions = useMemo(
    () => [...biomarkers].sort((a, b) => a.name.localeCompare(b.name)),
    [biomarkers],
  );

  // Manual override: add a marker the parser missed entirely.
  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { biomarker_id: null, biomarker_name: 'Manual entry', matched_name: null, value: null, unit: null, confidence: 1, include: true },
    ]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const confirm = async () => {
    const payloadRows = rows
      .filter((r) => r.biomarker_id && r.value !== null)
      .map((r) => ({ biomarker_id: r.biomarker_id as string, value: r.value as number, include: r.include }));
    if (!payloadRows.some((r) => r.include)) return push('error', 'Select at least one row to import');
    setBusy(true);
    try {
      const res = await api.confirmLab(upload.id, { tested_at: testedAt, lab_name: labName || undefined, rows: payloadRows });
      push('success', `Imported ${res.imported} results`);
      onConfirmed();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed to import');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Review parsed results" wide>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field label="Test date"><Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} /></Field>
        <Field label="Lab name"><Input value={labName} onChange={(e) => setLabName(e.target.value)} /></Field>
      </div>
      <div className="mb-2 flex items-center justify-between">
        {upload.file_url ? (
          <a href={upload.file_url} target="_blank" rel="noreferrer" className="text-sm text-greenInk hover:underline">
            View original PDF ↗
          </a>
        ) : <span />}
        <span className="text-xs text-inkMuted">
          Fix a wrong match with the dropdown, edit any value, or add a marker the parser missed.
        </span>
      </div>
      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel text-left text-xs uppercase text-inkMuted">
            <tr><th className="px-3 py-2">Import</th><th className="px-3 py-2">Biomarker</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Conf.</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const bm = r.biomarker_id ? bmById.get(r.biomarker_id) : null;
              const lowConf = r.confidence < 0.6;
              return (
                <tr key={i} className="border-t border-line" style={lowConf ? { backgroundColor: 'rgba(205,162,78,.08)' } : undefined}>
                  <td className="px-3 py-2">
                    <input type="checkbox" className="accent-accent" checked={r.include} onChange={(e) => setRow(i, { include: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.biomarker_id ?? ''}
                      onChange={(e) => setRow(i, { biomarker_id: e.target.value || null, include: e.target.value ? r.include : false })}
                      className="w-52 rounded border border-line bg-canvas px-2 py-1 text-ink outline-none focus:border-accent"
                    >
                      <option value="">— unmatched: pick a biomarker —</option>
                      {bmOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {r.biomarker_name && r.biomarker_name !== 'Manual entry' ? (
                      <div className="mt-0.5 text-xs text-inkMuted">
                        from PDF: {r.biomarker_name}
                        {r.reference_range ? <span className="ml-2">· lab range: {r.reference_range}</span> : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={r.value ?? ''}
                      onChange={(e) => setRow(i, { value: e.target.value === '' ? null : Number(e.target.value) })}
                      className="w-24 rounded border border-line bg-canvas px-2 py-1 tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2 text-inkSoft">{bm?.unit ?? r.unit ?? ''}</td>
                  <td className="px-3 py-2 text-inkMuted">{Math.round(r.confidence * 100)}%</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(i)} className="text-inkMuted hover:text-rust" title="Remove row">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-2 text-sm text-greenInk hover:underline">
        + Add a marker the parser missed
      </button>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={confirm} disabled={busy}>{busy ? 'Importing…' : 'Import selected'}</Button>
      </div>
    </Modal>
  );
}

// ── Add manual result ────────────────────────────────────────────────────────
function AddResultModal({
  userId,
  biomarkers,
  onClose,
  onSaved,
}: {
  userId: string;
  biomarkers: Biomarker[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [biomarkerId, setBiomarkerId] = useState(biomarkers[0]?.id ?? '');
  const [value, setValue] = useState('');
  const [testedAt, setTestedAt] = useState(today());
  const [labName, setLabName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!biomarkerId) return push('error', 'Pick a biomarker');
    if (value === '' || Number.isNaN(Number(value))) return push('error', 'Enter a numeric value');
    setBusy(true);
    try {
      await api.addResult(userId, {
        biomarker_id: biomarkerId,
        value: Number(value),
        tested_at: testedAt,
        lab_name: labName || undefined,
        notes: notes || undefined,
      });
      push('success', 'Result added');
      onSaved();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const bm = biomarkers.find((b) => b.id === biomarkerId);

  return (
    <Modal open onClose={onClose} title="Add result">
      <div className="space-y-4">
        <Field label="Biomarker">
          <Select value={biomarkerId} onChange={(e) => setBiomarkerId(e.target.value)}>
            {biomarkers.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.unit})</option>
            ))}
          </Select>
        </Field>
        <Field label={`Value${bm ? ` (${bm.unit})` : ''}`}>
          <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Test date"><Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} /></Field>
        <Field label="Lab name"><Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="optional" /></Field>
        <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Grant / edit subscription ────────────────────────────────────────────────
function SubscriptionModal({
  userId,
  plans,
  current,
  onClose,
  onSaved,
}: {
  userId: string;
  plans: SubscriptionPlan[];
  current: AdminUserDetail['subscription'];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const editing = !!current;
  const [planId, setPlanId] = useState(current?.plan.id ?? plans[0]?.id ?? '');
  const [months, setMonths] = useState(12);
  const [status, setStatus] = useState<'active' | 'expired' | 'cancelled'>(current?.status ?? 'active');
  const [expiresAt, setExpiresAt] = useState(
    current ? new Date(current.expires_at).toISOString().slice(0, 10) : '',
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!planId) return push('error', 'Pick a plan');
    setBusy(true);
    try {
      if (editing && current) {
        await api.updateSubscription(current.id, {
          status,
          plan_id: planId,
          expires_at: expiresAt ? new Date(`${expiresAt}T00:00:00Z`).toISOString() : undefined,
        });
      } else {
        await api.grantSubscription(userId, { plan_id: planId, months });
      }
      push('success', editing ? 'Subscription updated' : 'Subscription granted');
      onSaved();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit subscription' : 'Grant subscription'}>
      <div className="space-y-4">
        <Field label="Plan">
          <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.price_egp.toLocaleString()} EGP{p.is_active ? '' : ' (inactive)'}</option>
            ))}
          </Select>
        </Field>
        {editing ? (
          <>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </Select>
            </Field>
            <Field label="Expires"><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
          </>
        ) : (
          <Field label="Duration (months)">
            <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} min={1} max={60} />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save' : 'Grant'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit profile / role ──────────────────────────────────────────────────────
function EditProfileModal({
  detail,
  onClose,
  onSaved,
}: {
  detail: AdminUserDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [fullName, setFullName] = useState(detail.user.full_name);
  const [phone, setPhone] = useState(detail.user.phone ?? '');
  // Partner accounts are managed on the Lab Partners page; this toggle is user/admin only.
  const [role, setRole] = useState<'user' | 'admin'>(detail.user.role === 'admin' ? 'admin' : 'user');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.updateUser(detail.user.id, { full_name: fullName, phone: phone || undefined, role });
      push('success', 'Profile updated');
      onSaved();
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit profile">
      <div className="space-y-4">
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  );
}
