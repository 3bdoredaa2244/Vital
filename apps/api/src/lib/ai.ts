/**
 * AI Health Intelligence — Anthropic integration (Phase 2).
 *
 * Builds a grounding context from the user's VITAL Score + biomarker results,
 * then calls Claude (official SDK) to generate clinician-style insights,
 * protocols, and chat replies. All output is wellness guidance, never a
 * diagnosis — the persona + disclaimer come from the admin-managed AiConfig.
 *
 * Every entry point is gated on config.enabled + the relevant feature flag +
 * the presence of ANTHROPIC_API_KEY, and throws `unprocessable` otherwise so
 * the feature degrades gracefully when unconfigured.
 */
import Anthropic from '@anthropic-ai/sdk';
import { type AiConfig, classifyBiomarkerSafe } from '@vital/shared';
import { asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  aiChatMessages,
  aiChatSummaries,
  aiInsights,
  biomarkers,
  scoreSnapshots,
  userBiomarkerResults,
} from '../db/schema.js';
import { env } from './env.js';
import { fail } from './http.js';
import { computeUserScore } from './score.js';

const n = (v: string | number) => (typeof v === 'number' ? v : Number(v));

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    fail('unprocessable', 'AI is not configured on the server (missing API key).');
  }
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/** Assemble a compact, factual snapshot of the user's data for grounding. */
export async function buildUserContext(userId: string): Promise<string> {
  const score = await computeUserScore(userId);
  const lines: string[] = [];
  lines.push(`VITAL Score: ${score.score}/100 (${score.band}).`);
  if (score.biological_age != null && score.chronological_age != null) {
    lines.push(
      `Biological age: ${score.biological_age} vs chronological ${score.chronological_age} (${
        score.age_delta != null && score.age_delta <= 0 ? 'younger' : 'older'
      }).`,
    );
  }
  if (score.cardiometabolic_score != null) {
    lines.push(`Cardiometabolic sub-score: ${score.cardiometabolic_score}/100.`);
  }
  lines.push(
    `Coverage: ${score.tested_count} of ${score.total_count} markers tested (confidence ${score.confidence}%).`,
  );
  if (score.category_scores.length) {
    lines.push('Category scores:');
    for (const c of score.category_scores.filter((c) => c.tested > 0)) {
      lines.push(`  - ${c.name}: ${c.score}/100 (${c.tested}/${c.total} tested)`);
    }
  }
  if (score.drivers.negative.length) {
    lines.push('Markers needing attention:');
    for (const d of score.drivers.negative) lines.push(`  - ${d.name} (${d.category}): ${d.score}/100`);
  }
  if (score.drivers.positive.length) {
    lines.push('Strong markers:');
    for (const d of score.drivers.positive) lines.push(`  - ${d.name} (${d.category}): ${d.score}/100`);
  }

  // ── Exact latest values + change since the previous test (longitudinal memory).
  const results = await db
    .select({
      biomarkerId: userBiomarkerResults.biomarkerId,
      value: userBiomarkerResults.value,
      testedAt: userBiomarkerResults.testedAt,
      name: biomarkers.name,
      unit: biomarkers.unit,
      optimalLow: biomarkers.optimalLow,
      optimalHigh: biomarkers.optimalHigh,
      normalLow: biomarkers.normalLow,
      normalHigh: biomarkers.normalHigh,
    })
    .from(userBiomarkerResults)
    .innerJoin(biomarkers, eq(userBiomarkerResults.biomarkerId, biomarkers.id))
    .where(eq(userBiomarkerResults.userId, userId))
    .orderBy(desc(userBiomarkerResults.testedAt), desc(userBiomarkerResults.createdAt));

  const byMarker = new Map<string, typeof results>();
  for (const r of results) {
    const arr = byMarker.get(r.biomarkerId);
    if (arr) arr.push(r);
    else byMarker.set(r.biomarkerId, [r]);
  }

  if (byMarker.size) {
    // Prioritise out-of-range markers and cap the list so the prompt stays bounded
    // on users with a large panel.
    const RANK: Record<string, number> = { alert: 0, suboptimal: 1, optimal: 2, untested: 3 };
    const CAP = 30;
    const entries = [...byMarker.values()].map((arr) => {
      const latest = arr[0]!;
      const prev = arr[1];
      const status = classifyBiomarkerSafe(n(latest.value), {
        optimal_low: n(latest.optimalLow),
        optimal_high: n(latest.optimalHigh),
        normal_low: n(latest.normalLow),
        normal_high: n(latest.normalHigh),
      });
      return { latest, prev, status };
    });
    entries.sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9));

    lines.push('', 'Latest biomarker values (out-of-range first; change since the previous test):');
    for (const e of entries.slice(0, CAP)) {
      let line = `  - ${e.latest.name}: ${n(e.latest.value)} ${e.latest.unit} (${e.status}, tested ${e.latest.testedAt})`;
      if (e.prev) {
        const d = n(e.latest.value) - n(e.prev.value);
        const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '→';
        line += `; previously ${n(e.prev.value)} on ${e.prev.testedAt} (${arrow}${Math.abs(Math.round(d * 100) / 100)})`;
      }
      lines.push(line);
    }
    if (entries.length > CAP) {
      lines.push(`  …and ${entries.length - CAP} more in-range markers (ask about any specific one).`);
    }
  }

  // ── VITAL Score trend across recent tests.
  const snaps = await db
    .select({ score: scoreSnapshots.score, recordedOn: scoreSnapshots.recordedOn })
    .from(scoreSnapshots)
    .where(eq(scoreSnapshots.userId, userId))
    .orderBy(desc(scoreSnapshots.recordedOn))
    .limit(5);
  if (snaps.length > 1) {
    const trend = snaps
      .slice()
      .reverse()
      .map((s) => `${s.score} (${s.recordedOn})`)
      .join(' → ');
    lines.push('', `VITAL Score history: ${trend}.`);
  }

  return lines.join('\n');
}

function systemPrompt(config: AiConfig, context: string): string {
  return [
    config.persona,
    '',
    'Rules:',
    "- Stay strictly on scope: only discuss the user's lab results and biomarkers, and " +
      'general health, nutrition, fitness, sleep, supplements, stress, and lifestyle/wellness. ' +
      'If asked anything outside this (e.g. coding, news, general trivia, or unrelated topics), ' +
      'politely decline in one short sentence and steer back to their health and labs — do not ' +
      'answer the off-topic request.',
    '- Ground every statement in the user data provided. Do not invent values.',
    '- Explain what each finding means and what is modifiable through lifestyle.',
    '- Never diagnose disease, name medications, or give dosages.',
    '- Be concise, warm, and specific. Use short paragraphs and bullet points.',
    `- End nothing with false certainty; this is guidance, not medical advice.`,
    '',
    'USER HEALTH DATA:',
    context,
  ].join('\n');
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

interface GenerateResult {
  insights: { type: 'summary' | 'protocol'; title: string; body: string }[];
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/** Generate a panel summary and (optionally) a protocol for the user. */
export async function generateInsights(userId: string, config: AiConfig): Promise<GenerateResult> {
  if (!config.enabled || !config.features.insights) {
    fail('unprocessable', 'AI insights are disabled.');
  }
  const context = await buildUserContext(userId);
  const wantProtocol = config.features.protocols;

  const instruction = [
    'Produce a JSON object with this exact shape and nothing else:',
    '{',
    '  "summary": { "title": string, "body": string },',
    wantProtocol ? '  "protocol": { "title": string, "body": string }' : '  "protocol": null',
    '}',
    'The "summary" explains the overall picture and the 2–3 most important findings.',
    wantProtocol
      ? 'The "protocol" gives 3–6 concrete, modifiable lifestyle actions tied to the findings.'
      : '',
    'Bodies are markdown. Do not wrap the JSON in code fences.',
  ]
    .filter(Boolean)
    .join('\n');

  const message = await anthropic().messages.create({
    model: config.model,
    max_tokens: config.max_tokens,
    thinking: { type: 'adaptive' },
    system: systemPrompt(config, context),
    messages: [{ role: 'user', content: instruction }],
  });

  const raw = textOf(message);
  let parsed: { summary?: { title: string; body: string }; protocol?: { title: string; body: string } | null };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: treat the whole response as a single summary.
    parsed = { summary: { title: 'Health summary', body: raw } };
  }

  const insights: GenerateResult['insights'] = [];
  if (parsed.summary?.body) {
    insights.push({ type: 'summary', title: parsed.summary.title || 'Health summary', body: parsed.summary.body });
  }
  if (wantProtocol && parsed.protocol?.body) {
    insights.push({ type: 'protocol', title: parsed.protocol.title || 'Your protocol', body: parsed.protocol.body });
  }

  return {
    insights,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    model: config.model,
  };
}

/**
 * Generate insights and persist them. `source` records who triggered it;
 * `require_review` decides whether they start as drafts or are auto-published.
 */
export async function generateAndStoreInsights(
  userId: string,
  config: AiConfig,
  source: 'system' | 'admin' | 'user',
): Promise<number> {
  const result = await generateInsights(userId, config);
  if (result.insights.length === 0) return 0;
  const status = config.require_review ? 'draft' : 'published';
  const publishedAt = status === 'published' ? new Date() : null;
  await db.insert(aiInsights).values(
    result.insights.map((i) => ({
      userId,
      type: i.type,
      title: i.title,
      body: i.body,
      status,
      model: result.model,
      source,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      publishedAt,
    })),
  );
  return result.insights.length;
}

/** Grounded chat reply. Persists both the user message and the assistant reply. */
// Recent messages kept verbatim; older ones are folded into the rolling summary
// once the verbatim window grows past MAX_VERBATIM (folding back down to KEEP).
const KEEP_RECENT = 10;
const MAX_VERBATIM = 20;

/** Condense older messages into/onto the existing summary. */
async function summariseConversation(
  existing: string,
  msgs: { role: string; content: string }[],
  config: AiConfig,
): Promise<string> {
  const transcript = msgs.map((m) => `${m.role}: ${m.content}`).join('\n');
  const prompt =
    'Update the running summary of this health-coaching conversation. Keep it under 180 words. ' +
    "Preserve the user's goals, concerns, lifestyle details, preferences, and any guidance already " +
    'given, so future replies stay consistent. Return only the updated summary.\n\n' +
    `EXISTING SUMMARY:\n${existing || '(none yet)'}\n\nNEW MESSAGES TO FOLD IN:\n${transcript}`;
  try {
    const m = await anthropic().messages.create({
      model: config.model,
      max_tokens: 400,
      system: 'You write concise, faithful running summaries of a wellness conversation.',
      messages: [{ role: 'user', content: prompt }],
    });
    return textOf(m) || existing;
  } catch {
    return existing; // never block a reply on summarisation
  }
}

/** Ensure the rolling summary covers all-but-recent messages; returns it. */
async function rollingSummary(
  userId: string,
  config: AiConfig,
): Promise<{ text: string; coveredCount: number }> {
  const [row] = await db
    .select({ summary: aiChatSummaries.summary, coveredCount: aiChatSummaries.coveredCount })
    .from(aiChatSummaries)
    .where(eq(aiChatSummaries.userId, userId))
    .limit(1);
  let text = row?.summary ?? '';
  let covered = row?.coveredCount ?? 0;

  const [{ total } = { total: 0 }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(aiChatMessages)
    .where(eq(aiChatMessages.userId, userId));

  if (total - covered > MAX_VERBATIM) {
    const foldCount = total - covered - KEEP_RECENT;
    const older = await db
      .select({ role: aiChatMessages.role, content: aiChatMessages.content })
      .from(aiChatMessages)
      .where(eq(aiChatMessages.userId, userId))
      .orderBy(asc(aiChatMessages.seq))
      .offset(covered)
      .limit(foldCount);
    text = await summariseConversation(text, older, config);
    covered += foldCount;
    await db
      .insert(aiChatSummaries)
      .values({ userId, summary: text, coveredCount: covered })
      .onConflictDoUpdate({
        target: aiChatSummaries.userId,
        set: { summary: text, coveredCount: covered, updatedAt: new Date() },
      });
  }
  return { text, coveredCount: covered };
}

export async function chatReply(userId: string, userMessage: string, config: AiConfig): Promise<string> {
  if (!config.enabled || !config.features.chat) {
    fail('unprocessable', 'AI chat is disabled.');
  }
  const context = await buildUserContext(userId);

  // Rolling memory: messages older than the recent window are folded into a
  // per-user summary so long conversations keep full context.
  const summary = await rollingSummary(userId, config);

  // Recent messages kept verbatim (everything not yet folded into the summary).
  const recent = await db
    .select({ role: aiChatMessages.role, content: aiChatMessages.content })
    .from(aiChatMessages)
    .where(eq(aiChatMessages.userId, userId))
    .orderBy(asc(aiChatMessages.seq))
    .offset(summary.coveredCount)
    .limit(MAX_VERBATIM);

  const fullContext = summary.text
    ? `${context}\n\nEARLIER CONVERSATION SUMMARY:\n${summary.text}`
    : context;

  const messages: Anthropic.MessageParam[] = [
    ...recent.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const message = await anthropic().messages.create({
    model: config.model,
    max_tokens: config.max_tokens,
    thinking: { type: 'adaptive' },
    system: systemPrompt(config, fullContext),
    messages,
  });
  const reply = textOf(message) || 'I could not generate a response. Please try again.';

  await db.insert(aiChatMessages).values([
    { userId, role: 'user', content: userMessage },
    {
      userId,
      role: 'assistant',
      content: reply,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  ]);
  return reply;
}
