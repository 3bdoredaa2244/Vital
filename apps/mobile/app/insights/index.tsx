/**
 * AI Insights & Chat — shows the user's published clinician notes / protocols
 * and a grounded chat. Surfaces are gated by the admin-managed AI config; the
 * disclaimer is always shown.
 */
import type { AiChatMessage, AiInsight, AiStatus } from '@vital/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, LucideIcon, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, aiApi } from '@/lib/api';

export default function Insights() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Optional seed prompt (e.g. tapped "Explore your labs in detail" on Labs Summary).
  const { ask } = useLocalSearchParams<{ ask?: string }>();
  const askedRef = useRef(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status: s } = await aiApi.status();
        setStatus(s);
        if (s.enabled) {
          if (s.features.insights || s.features.protocols) {
            const { insights } = await aiApi.insights();
            setInsights(insights);
          }
          if (s.features.chat) {
            const { messages } = await aiApi.chatHistory();
            setMessages(messages);
          }
        }
      } catch {
        /* leave empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    const optimistic: AiChatMessage = {
      id: `tmp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const { reply } = await aiApi.sendChat(text);
      setMessages((m) => [
        ...m,
        { id: `r-${Date.now()}`, user_id: '', role: 'assistant', content: reply, created_at: new Date().toISOString() },
      ]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send');
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  // Auto-send the seed prompt once, after load, when chat is enabled.
  useEffect(() => {
    if (askedRef.current || loading || !ask) return;
    if (!status?.enabled || !status.features.chat) return;
    askedRef.current = true;
    void send(ask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, status, ask]);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await aiApi.generate();
      if (r.pending_review) toast.info('Your insights are being prepared.');
      else {
        const { insights } = await aiApi.insights();
        setInsights(insights);
        toast.success('Insights ready');
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not generate');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!status?.enabled) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 12 }}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 px-5">
          <EmptyState icon="Sparkles" title="Coming soon" message="AI insights aren't available yet." />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.obsidian }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 12 }}>
        <Header onBack={() => router.back()} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
        {/* Insights */}
        {status.features.insights || status.features.protocols ? (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-display" style={{ color: colors.white, fontSize: 20 }}>
                Your insights
              </Text>
              {status.allow_user_generate ? (
                <Button label={generating ? 'Generating…' : 'Generate'} variant="secondary" onPress={generate} disabled={generating} />
              ) : null}
            </View>
            {insights.length === 0 ? (
              <Text className="mb-4 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
                No insights yet. They appear here once prepared from your results.
              </Text>
            ) : (
              insights.map((i) => (
                <View
                  key={i.id}
                  className="mb-3 rounded-lg border p-4"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <View className="mb-1 flex-row items-center" style={{ gap: 6 }}>
                    <LucideIcon name={i.type === 'protocol' ? 'ListChecks' : 'Sparkles'} size={16} color={colors.gold} />
                    <Text className="font-display" style={{ color: colors.white, fontSize: 16 }}>{i.title}</Text>
                  </View>
                  <Text className="font-body" style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{i.body}</Text>
                </View>
              ))
            )}
          </>
        ) : null}

        {/* Chat */}
        {status.features.chat ? (
          <View className="mt-4">
            <Text className="mb-3 font-display" style={{ color: colors.white, fontSize: 20 }}>Ask about your results</Text>
            {messages.map((m) => (
              <View
                key={m.id}
                className="mb-2 max-w-[85%] rounded-lg p-3"
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.role === 'user' ? colors.gold : colors.surface,
                  borderWidth: m.role === 'user' ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="font-body" style={{ color: m.role === 'user' ? colors.obsidian : colors.text, fontSize: 14, lineHeight: 20 }}>
                  {m.content}
                </Text>
              </View>
            ))}
            {sending ? <ActivityIndicator color={colors.gold} style={{ alignSelf: 'flex-start', marginVertical: 6 }} /> : null}
          </View>
        ) : null}

        <Text className="mt-6 text-center font-body" style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
          {status.disclaimer}
        </Text>
      </ScrollView>

      {status.features.chat ? (
        <View
          className="flex-row items-center border-t px-4 py-3"
          style={{ borderColor: colors.border, backgroundColor: colors.deep, paddingBottom: insets.bottom + 10, gap: 8 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question…"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.white, fontSize: 14, paddingVertical: 8 }}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <Pressable onPress={() => send()} disabled={sending || !input.trim()} style={{ opacity: sending || !input.trim() ? 0.4 : 1 }}>
            <LucideIcon name="SendHorizontal" size={22} color={colors.gold} />
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 pb-3" style={{ gap: 10 }}>
      <Pressable onPress={onBack} hitSlop={10}>
        <LucideIcon name="ChevronLeft" size={24} color={colors.white} />
      </Pressable>
      <Text className="font-display" style={{ color: colors.white, fontSize: 22 }}>VITAL AI</Text>
    </View>
  );
}
