'use client';

/**
 * Biomarker detail — the marker's ranges with the user's value plotted, the
 * educational copy from the catalog, the full result history, and manual
 * result entry (POST /results) / deletion (DELETE /results/:id).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResultInput, UserBiomarkerResult } from '@vital/shared';
import { plausibleResultSchema } from '@vital/shared';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { RangeBar } from '@/components/RangeBar';
import { AsyncSection } from '@/components/states';
import { useToast } from '@/components/toast';
import {
  Button,
  Card,
  DataRow,
  Eyebrow,
  Field,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { biomarkerApi, resultApi } from '@/lib/api';
import { formatDate, formatNumber, todayIso } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

function ResultRow({
  result,
  unit,
  onDelete,
  deleting,
}: {
  result: UserBiomarkerResult;
  unit: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg text-ink">
          {formatNumber(result.value)}
          <span className="ml-1 font-sans text-[11px] text-inkSoft">{unit}</span>
        </div>
        <div className="text-xs text-inkMuted">
          {formatDate(result.tested_at)}
          {result.lab_name ? ` · ${result.lab_name}` : ''}
          {result.reference_range ? ` · lab ref ${result.reference_range}` : ''}
        </div>
        {result.notes ? <p className="mt-1 text-xs text-inkSoft">{result.notes}</p> : null}
      </div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-eyebrow text-inkMuted">
        {result.source}
      </span>
      {/* The API only permits deleting results the user entered themselves. */}
      {result.source === 'manual' ? (
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete result"
          className="shrink-0 rounded-sm p-1.5 text-inkMuted transition hover:bg-rust/10 hover:text-rust disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  );
}

export default function BiomarkerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const detail = useApi(() => biomarkerApi.get(id), [id]);
  const results = useApi(() => resultApi.forBiomarker(id), [id]);

  const biomarker = detail.data?.biomarker;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateResultInput>({
    resolver: zodResolver(
      plausibleResultSchema(biomarker?.min_plausible ?? -1e9, biomarker?.max_plausible ?? 1e9),
    ),
    defaultValues: { biomarker_id: id, tested_at: todayIso() },
  });

  const onAdd = async (data: CreateResultInput) => {
    try {
      await resultApi.create({ ...data, biomarker_id: id });
      toast.success('Result added.');
      setAddOpen(false);
      reset({ biomarker_id: id, tested_at: todayIso() });
      results.reload();
      detail.reload();
    } catch (err) {
      toast.error(messageFor(err, 'Could not save that result.'));
    }
  };

  const onDelete = async (resultId: string) => {
    setDeletingId(resultId);
    try {
      await resultApi.remove(resultId);
      toast.success('Result removed.');
      results.reload();
      detail.reload();
    } catch (err) {
      toast.error(messageFor(err, 'Could not remove that result.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <Link
        href="/biomarkers"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-inkSoft transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Biomarkers
      </Link>

      <AsyncSection
        state={detail}
        feature="biomarker detail"
        loading={
          <div className="space-y-4">
            <Skeleton width="45%" height={36} />
            <Skeleton height={120} />
            <Skeleton height={200} />
          </div>
        }
      >
        {(data) => {
          const b = data.biomarker;
          const latest = b.latest_result;
          return (
            <>
              <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {b.category ? (
                      <>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: b.category.color }}
                        />
                        <Eyebrow>{b.category.name}</Eyebrow>
                      </>
                    ) : null}
                  </div>
                  <h1 className="mt-1.5 font-display text-4xl leading-tight text-ink">{b.name}</h1>
                  <p className="mt-1 text-sm text-inkSoft">Measured in {b.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
                    Add result
                  </Button>
                </div>
              </header>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Current value + range */}
                <Card className="p-5 lg:col-span-2">
                  <Eyebrow tone="soft">Your latest result</Eyebrow>
                  {latest ? (
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-5xl text-ink">
                        {formatNumber(latest.value)}
                      </span>
                      <span className="text-sm text-inkSoft">{b.unit}</span>
                      <span className="ml-auto text-xs text-inkMuted">
                        {formatDate(latest.tested_at)}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-inkSoft">
                      Not tested yet. Add a result or book a test to see where you sit.
                    </p>
                  )}

                  <div className="mt-6">
                    <RangeBar range={b} value={latest?.value ?? null} unit={b.unit} mode="optimal" />
                  </div>

                  <div className="mt-5 border-t border-line pt-2">
                    <DataRow
                      label="Optimal range"
                      value={`${formatNumber(b.optimal_low)} – ${formatNumber(b.optimal_high)} ${b.unit}`}
                    />
                    <DataRow
                      label="Standard normal"
                      value={`${formatNumber(b.normal_low)} – ${formatNumber(b.normal_high)} ${b.unit}`}
                    />
                    {latest?.reference_range ? (
                      <DataRow label="Your lab's range" value={latest.reference_range} />
                    ) : null}
                  </div>
                </Card>

                {/* Educational copy from the catalog */}
                <Card className="p-5">
                  <Eyebrow tone="soft">Why it matters</Eyebrow>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-inkSoft">
                    {b.why_it_matters || b.description || 'No description available for this marker.'}
                  </p>
                  {b.what_affects_it ? (
                    <>
                      <div className="my-4 border-t border-line" />
                      <Eyebrow tone="soft">What affects it</Eyebrow>
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-inkSoft">
                        {b.what_affects_it}
                      </p>
                    </>
                  ) : null}
                </Card>
              </div>

              {/* History */}
              <section className="mt-8">
                <SectionHeader title="History" subtitle="Every recorded value for this marker." />
                {results.loading ? (
                  <Skeleton height={100} />
                ) : results.error ? (
                  <Card className="p-5 text-sm text-inkSoft">
                    Could not load your history for this marker.
                  </Card>
                ) : (results.data?.results.length ?? 0) === 0 ? (
                  <Card className="p-6 text-sm text-inkSoft">
                    No results recorded yet for {b.name}.
                  </Card>
                ) : (
                  <Card className="divide-y divide-line">
                    {results.data!.results.map((r) => (
                      <ResultRow
                        key={r.id}
                        result={r}
                        unit={b.unit}
                        deleting={deletingId === r.id}
                        onDelete={() => void onDelete(r.id)}
                      />
                    ))}
                  </Card>
                )}
              </section>

              {/* Add result */}
              <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add ${b.name} result`}>
                <form onSubmit={handleSubmit(onAdd)} noValidate>
                  <Field
                    label={`Value (${b.unit})`}
                    error={errors.value?.message}
                    hint={`Plausible range: ${formatNumber(b.min_plausible)} – ${formatNumber(b.max_plausible)}`}
                    htmlFor="value"
                  >
                    <Input
                      id="value"
                      type="number"
                      step="any"
                      autoFocus
                      invalid={!!errors.value}
                      {...register('value', { setValueAs: (v) => (v === '' ? NaN : Number(v)) })}
                    />
                  </Field>

                  <Field label="Tested on" error={errors.tested_at?.message} htmlFor="tested_at">
                    <Input
                      id="tested_at"
                      type="date"
                      max={todayIso()}
                      invalid={!!errors.tested_at}
                      {...register('tested_at')}
                    />
                  </Field>

                  <Field label="Lab name (optional)" error={errors.lab_name?.message} htmlFor="lab_name">
                    <Input id="lab_name" placeholder="Al Borg Laboratories" {...register('lab_name')} />
                  </Field>

                  <Field label="Notes (optional)" error={errors.notes?.message} htmlFor="notes">
                    <Textarea id="notes" rows={3} placeholder="Fasted, morning draw…" {...register('notes')} />
                  </Field>

                  <div className="mt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" loading={isSubmitting}>
                      Save result
                    </Button>
                  </div>
                </form>
              </Modal>
            </>
          );
        }}
      </AsyncSection>
    </div>
  );
}
