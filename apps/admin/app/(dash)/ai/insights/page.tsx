'use client';

import type { AiInsight } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { Button, Card, EmptyRow, Spinner, StatusPill, Table, Td, Th } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

const STATUSES = ['draft', 'published', 'archived'] as const;

export default function InsightsPage() {
  const { push } = useToast();
  const [status, setStatus] = useState<string>('draft');
  const [rows, setRows] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<AiInsight | null>(null);

  const load = (s: string) => {
    setLoading(true);
    api
      .aiInsights({ status: s })
      .then((r) => setRows(r.insights))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(status), [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      push('success', ok);
      load(status);
      setOpen(null);
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    }
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold text-ink">AI Insights</h1>
      <div className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              status === s ? 'bg-accent/15 text-greenInk' : 'text-inkSoft hover:bg-panel'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Table head={<><Th>Title</Th><Th>Type</Th><Th>Source</Th><Th>Status</Th><Th>Created</Th><Th /></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label={`No ${status} insights.`} />
          ) : (
            rows.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <Td className="font-medium text-ink">
                  <button onClick={() => setOpen(i)} className="text-left hover:underline">{i.title}</button>
                </Td>
                <Td className="capitalize text-inkSoft">{i.type}</Td>
                <Td className="capitalize text-inkSoft">{i.source}</Td>
                <Td><StatusPill status={i.status === 'published' ? 'active' : i.status === 'archived' ? 'expired' : 'cancelled'} /></Td>
                <Td className="text-inkMuted">{new Date(i.created_at).toLocaleDateString('en-GB')}</Td>
                <Td>
                  <div className="flex gap-3">
                    {i.status !== 'published' ? (
                      <button onClick={() => act(() => api.publishInsight(i.id), 'Published')} className="text-sm text-greenInk hover:underline">Publish</button>
                    ) : null}
                    {i.status !== 'archived' ? (
                      <button onClick={() => act(() => api.archiveInsight(i.id), 'Archived')} className="text-sm text-amber hover:underline">Archive</button>
                    ) : null}
                    <button onClick={() => { if (confirm('Delete insight?')) act(() => api.deleteInsight(i.id), 'Deleted'); }} className="text-sm text-rust hover:underline">Delete</button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(null)}>
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6" >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">{open.title}</h3>
                <div className="text-xs text-inkMuted">{open.type} · {open.model} · {open.source}</div>
              </div>
              <button onClick={() => setOpen(null)} className="text-inkSoft hover:text-ink">✕</button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-ink">{open.body}</div>
            <div className="mt-5 flex justify-end gap-2">
              {open.status !== 'published' ? (
                <Button onClick={() => act(() => api.publishInsight(open.id), 'Published')}>Publish</Button>
              ) : null}
              {open.status !== 'archived' ? (
                <Button variant="ghost" onClick={() => act(() => api.archiveInsight(open.id), 'Archived')}>Archive</Button>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
