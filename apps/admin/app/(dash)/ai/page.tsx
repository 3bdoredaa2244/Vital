'use client';

import type { AiConfigInput, AiUsageStats } from '@vital/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

export default function AiPage() {
  const { push } = useToast();
  const [form, setForm] = useState<AiConfigInput | null>(null);
  const [usage, setUsage] = useState<AiUsageStats | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.aiConfig().then((r) => setForm(r.config)).catch((e) => push('error', e.message));
    api.aiUsage().then((r) => setUsage(r.usage)).catch(() => {});
  }, [push]);

  if (!form) return <Spinner />;

  const save = async () => {
    setBusy(true);
    try {
      const { config } = await api.saveAiConfig(form);
      setForm(config);
      push('success', 'AI settings saved');
    } catch (e) {
      push('error', e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const setFeature = (k: keyof AiConfigInput['features'], v: boolean) =>
    setForm({ ...form, features: { ...form.features, [k]: v } });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">AI Intelligence</h1>
        <Link href="/ai/insights" className="text-sm text-greenInk hover:underline">
          Review insights →
        </Link>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-inkSoft">
        Controls the AI that writes clinician notes, protocols, and chat replies grounded in each
        user&apos;s lab data. Requires <code>ANTHROPIC_API_KEY</code> on the API server.
      </p>

      <div className="max-w-2xl space-y-6">
        <Card className="p-5">
          <label className="flex items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            AI enabled (master switch)
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Model">
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Field>
            <Field label="Max tokens per response">
              <Input
                type="number"
                value={form.max_tokens}
                onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-ink">Features</h3>
          <div className="space-y-2 text-sm text-ink">
            {(['insights', 'protocols', 'chat'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 capitalize">
                <input type="checkbox" checked={form.features[k]} onChange={(e) => setFeature(k, e.target.checked)} />
                {k}
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.require_review}
                onChange={(e) => setForm({ ...form, require_review: e.target.checked })}
              />
              Require admin review before users see insights (recommended)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allow_user_generate}
                onChange={(e) => setForm({ ...form, allow_user_generate: e.target.checked })}
              />
              Allow users to generate their own insights
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <Field label="Persona / system instructions">
            <Textarea
              rows={4}
              value={form.persona}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
            />
          </Field>
          <Field label="Medical disclaimer (shown to users)">
            <Textarea
              rows={2}
              value={form.disclaimer}
              onChange={(e) => setForm({ ...form, disclaimer: e.target.value })}
            />
          </Field>
        </Card>

        {usage ? (
          <Card className="p-5">
            <h3 className="mb-2 font-display text-lg font-bold text-ink">Usage</h3>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><div className="font-display text-2xl font-bold text-ink">{usage.insight_count}</div><div className="text-inkSoft">insights</div></div>
              <div><div className="font-display text-2xl font-bold text-ink">{usage.chat_message_count}</div><div className="text-inkSoft">chat msgs</div></div>
              <div><div className="font-display text-2xl font-bold text-ink">{usage.total_input_tokens.toLocaleString()}</div><div className="text-inkSoft">input tokens</div></div>
              <div><div className="font-display text-2xl font-bold text-ink">{usage.total_output_tokens.toLocaleString()}</div><div className="text-inkSoft">output tokens</div></div>
            </div>
          </Card>
        ) : null}

        <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </div>
  );
}
