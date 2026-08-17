'use client';

/**
 * VITAL AI — published insights plus the chat assistant.
 *
 * Both are admin-controlled: `/ai-status` says whether AI is enabled at all,
 * which sub-features are on, and whether users may trigger their own insight
 * generation. We respect every one of those flags rather than showing controls
 * that would fail.
 */
import type { AiChatMessage, AiInsight } from '@vital/shared';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SubscriptionGate } from '@/components/states';
import { useToast } from '@/components/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Input,
  LoadingState,
  PageHeader,
  SkeletonList,
  Spinner,
} from '@/components/ui';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { messageFor, useApi } from '@/lib/use-api';

/**
 * Minimal markdown rendering for insight bodies: headings, bullets, bold, and
 * paragraphs. Insight text comes from our own admin-reviewed pipeline, and we
 * deliberately render it as text rather than HTML — no dangerouslySetInnerHTML.
 */
function InsightBody({ body }: { body: string }) {
  const lines = body.split('\n');
  return (
    <div className="space-y-2 text-[14px] leading-relaxed text-inkSoft">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-1" />;

        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
          const text = line.replace(/^#+\s*/, '');
          return (
            <h4 key={i} className="pt-2 font-display text-base text-ink">
              {text}
            </h4>
          );
        }
        if (/^\s*[-*]\s+/.test(line)) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{stripBold(line.replace(/^\s*[-*]\s+/, ''))}</span>
            </div>
          );
        }
        return <p key={i}>{stripBold(line)}</p>;
      })}
    </div>
  );
}

/** Renders **bold** spans without parsing arbitrary HTML. */
function stripBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-xl text-ink">{insight.title}</h3>
        <Badge color={insight.type === 'protocol' ? '#6E8BA0' : '#6FA97D'}>{insight.type}</Badge>
      </div>
      <p className="mt-1 text-xs text-inkMuted">
        {formatDateTime(insight.published_at ?? insight.created_at)}
      </p>
      <div className="mt-4">
        <InsightBody body={insight.body} />
      </div>
    </Card>
  );
}

function ChatPanel({ disclaimer }: { disclaimer: string }) {
  const toast = useToast();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiApi
      .chatHistory()
      .then((r) => setMessages(r.messages))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    // Optimistically show the user's message; the API persists both sides.
    const optimistic: AiChatMessage = {
      id: `local-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const { reply } = await aiApi.sendChat(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-reply-${Date.now()}`,
          user_id: '',
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      // Roll the optimistic message back so the transcript stays truthful.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      toast.error(messageFor(err, 'Could not send that message.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex h-[min(70vh,640px)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {loading ? (
          <LoadingState label="Loading your conversation" />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={26} />}
            title="Ask about your results"
            message="VITAL AI can explain what a marker means, why yours is where it is, and what tends to move it."
          />
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-3 text-[14px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-accent text-canvas'
                    : 'border border-line bg-panel text-ink'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-3 text-inkSoft">
              <Spinner size={14} />
              <span className="text-[13px]">Thinking…</span>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about a marker, a result, or a protocol…"
          aria-label="Message"
          disabled={sending}
        />
        <Button type="submit" disabled={!draft.trim() || sending} icon={<Send size={15} />}>
          Send
        </Button>
      </form>

      {disclaimer ? (
        <p className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-inkMuted">
          {disclaimer}
        </p>
      ) : null}
    </Card>
  );
}

export default function AiPage() {
  const { hasActiveSubscription, subscriptionLoaded } = useAuth();
  const toast = useToast();
  const enabled = subscriptionLoaded && hasActiveSubscription;
  const [tab, setTab] = useState<'insights' | 'chat'>('insights');
  const [generating, setGenerating] = useState(false);

  const status = useApi(() => aiApi.status(), []);
  const insights = useApi(() => aiApi.insights(), [], enabled);

  const ai = status.data?.status;

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await aiApi.generate();
      if (res.pending_review) {
        toast.info('Your insights were generated and are awaiting clinical review.');
      } else {
        toast.success(`${res.generated} new insight${res.generated === 1 ? '' : 's'} ready.`);
        insights.reload();
      }
    } catch (err) {
      toast.error(messageFor(err, 'Could not generate insights right now.'));
    } finally {
      setGenerating(false);
    }
  };

  if (status.loading) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="VITAL AI" />
        <SkeletonList count={3} />
      </div>
    );
  }

  // AI is an admin-controlled feature; if it's off, say so rather than showing
  // controls that would fail.
  if (!ai?.enabled) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="VITAL AI" />
        <Card>
          <EmptyState
            icon={<Sparkles size={26} />}
            title="VITAL AI is not enabled"
            message="Your VITAL team hasn't switched on AI health intelligence yet. When they do, your insights and assistant will appear here."
          />
        </Card>
      </div>
    );
  }

  if (subscriptionLoaded && !hasActiveSubscription) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="VITAL AI" />
        <Card>
          <SubscriptionGate feature="AI insights and the health assistant" />
        </Card>
      </div>
    );
  }

  const showInsights = ai.features.insights || ai.features.protocols;
  const showChat = ai.features.chat;

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="VITAL AI"
        subtitle="Clinician-reviewed notes generated from your own lab data, plus an assistant that can explain them."
        action={
          showInsights && ai.allow_user_generate ? (
            <Button onClick={generate} loading={generating} icon={<Sparkles size={15} />}>
              Generate insights
            </Button>
          ) : undefined
        }
      />

      {showInsights && showChat ? (
        <div className="mb-5 inline-flex rounded-md border border-line bg-panel p-1">
          <button
            onClick={() => setTab('insights')}
            aria-pressed={tab === 'insights'}
            className={`rounded-sm px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-eyebrow transition ${
              tab === 'insights' ? 'bg-card text-accent shadow-sm' : 'text-inkSoft hover:text-ink'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setTab('chat')}
            aria-pressed={tab === 'chat'}
            className={`rounded-sm px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-eyebrow transition ${
              tab === 'chat' ? 'bg-card text-accent shadow-sm' : 'text-inkSoft hover:text-ink'
            }`}
          >
            Chat
          </button>
        </div>
      ) : null}

      {(tab === 'chat' && showChat) || !showInsights ? (
        <ChatPanel disclaimer={ai.disclaimer} />
      ) : (
        <>
          {insights.loading ? (
            <SkeletonList count={3} />
          ) : insights.error ? (
            insights.error.kind === 'forbidden' ? (
              <Card>
                <SubscriptionGate feature="AI insights" />
              </Card>
            ) : (
              <Card className="p-6 text-sm text-inkSoft">{insights.error.message}</Card>
            )
          ) : (insights.data?.insights.length ?? 0) === 0 ? (
            <Card>
              <EmptyState
                icon={<Sparkles size={26} />}
                title="No insights yet"
                message={
                  ai.allow_user_generate
                    ? 'Generate a set from your latest results, or wait for your VITAL team to publish one.'
                    : 'Your VITAL team publishes insights after reviewing your results. Check back after your next test.'
                }
                action={
                  ai.allow_user_generate ? (
                    <Button onClick={generate} loading={generating}>
                      Generate insights
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {ai.disclaimer ? (
                <div className="rounded-md border border-line bg-panel px-4 py-3 text-xs leading-relaxed text-inkSoft">
                  {ai.disclaimer}
                </div>
              ) : null}
              {insights.data!.insights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
