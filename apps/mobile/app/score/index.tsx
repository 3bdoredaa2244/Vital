/**
 * VITAL Score — the user's overall health score on its own page: hero + history,
 * biological age and sub-scores, coverage/confidence, and the markers driving it.
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LucideIcon, ScoreHero } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useScoreStore } from '@/lib/store/score';
import { useSubscriptionStore } from '@/lib/store/subscription';

export default function ScoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasActive = useSubscriptionStore((s) => s.hasActive);
  const score = useScoreStore((s) => s.score);
  const history = useScoreStore((s) => s.history);
  const loaded = useScoreStore((s) => s.loaded);
  const fetchScore = useScoreStore((s) => s.fetch);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (hasActive()) void fetchScore();
  }, [hasActive, fetchScore]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-4 pb-2" style={{ gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <LucideIcon name="ChevronLeft" size={24} color={colors.white} />
        </Pressable>
        <Text className="flex-1 font-display" style={{ color: colors.white, fontSize: 22 }}>
          VITAL Score
        </Text>
        <Pressable onPress={() => setInfoOpen(true)} hitSlop={10} accessibilityLabel="How the score works">
          <LucideIcon name="Info" size={22} color={colors.textDim} />
        </Pressable>
      </View>

      <ScoreInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} score={score} />

      {!loaded ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : !score || score.tested_count === 0 ? (
        <View className="flex-1 px-5">
          <EmptyState
            icon="Activity"
            title="No score yet"
            message="Your VITAL Score appears once you have biomarker results. Book a test or add results to get started."
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-2">
            <ScoreHero score={score} history={history} />
          </View>

          {/* Sub-scores */}
          <View className="mt-5 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            <Metric label="Biological age" value={fmt(score.biological_age)} hint={ageHint(score)} />
            <Metric label="Cardiometabolic" value={fmt(score.cardiometabolic_score)} suffix="/100" />
            <Metric label="Longevity" value={fmt(score.longevity_score)} suffix="/100" />
            <Metric label="Confidence" value={String(score.confidence)} suffix="%" />
          </View>

          {/* Coverage */}
          <View
            className="mt-4 rounded-lg border p-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="font-body" style={{ color: colors.textDim, fontSize: 13, lineHeight: 19 }}>
              Based on{' '}
              <Text style={{ color: colors.white, fontWeight: '700' }}>
                {score.tested_count} of {score.total_count}
              </Text>{' '}
              markers tested. More results sharpen the picture.
            </Text>
          </View>

          {/* Drivers */}
          {score.drivers.negative.length > 0 ? (
            <DriverList title="Holding you back" drivers={score.drivers.negative} color={colors.red} />
          ) : null}
          {score.drivers.positive.length > 0 ? (
            <DriverList title="Working in your favour" drivers={score.drivers.positive} color={colors.green} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const fmt = (v: number | null) => (v == null ? '—' : String(v));

function ageHint(score: { age_delta: number | null; chronological_age: number | null }): string | undefined {
  if (score.age_delta != null && score.age_delta !== 0) {
    return `${score.age_delta < 0 ? '−' : '+'}${Math.abs(score.age_delta)}y vs ${score.chronological_age ?? '—'}`;
  }
  return score.chronological_age != null ? `chrono ${score.chronological_age}` : undefined;
}

function Metric({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return (
    <View style={{ width: '50%', padding: 4 }}>
      <View
        className="rounded-lg border p-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="font-mono uppercase tracking-widest" style={{ color: colors.textMuted, fontSize: 10 }}>
          {label}
        </Text>
        <Text className="mt-1 font-display" style={{ color: colors.white, fontSize: 24 }}>
          {value}
          {suffix ? <Text style={{ color: colors.textDim, fontSize: 13 }}>{suffix}</Text> : null}
        </Text>
        {hint ? (
          <Text className="font-body" style={{ color: colors.textDim, fontSize: 11, marginTop: 2 }}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ScoreInfoModal({
  visible,
  onClose,
  score,
}: {
  visible: boolean;
  onClose: () => void;
  score: { tested_count: number; total_count: number } | null;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.obsidian,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderColor: colors.border,
            borderWidth: 1,
            maxHeight: '85%',
          }}
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
            <Text className="font-display" style={{ color: colors.white, fontSize: 20 }}>
              How your score works
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <LucideIcon name="X" size={22} color={colors.textDim} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            <Text className="font-body" style={{ color: colors.textDim, fontSize: 14, lineHeight: 21 }}>
              Your VITAL Score (0–100) is a single read on your current health, blended from your
              blood biomarkers and your biological age.
            </Text>

            <Section title="What goes into it">
              <Bullet>
                <B>Biomarker health</B> — every result is scored against its optimal range (best),
                the standard normal range (okay), or outside it (needs attention), then averaged
                across categories.
              </Bullet>
              <Bullet>
                <B>Cardiometabolic health</B> — your metabolic, cardiovascular and inflammatory
                markers, weighted a little heavier because they drive long-term risk.
              </Bullet>
              <Bullet>
                <B>Biological age</B> — a published model (PhenoAge) estimates your body’s age from
                key bloods; being younger than your real age lifts the score.
              </Bullet>
            </Section>

            <Section title="The other numbers">
              <Bullet><B>Longevity</B> leans on biological age and cardiometabolic health.</Bullet>
              <Bullet>
                <B>Confidence</B> reflects how complete and recent your data is — not how good your
                health is. It rises as you test more markers and keep them current.
              </Bullet>
            </Section>

            <Section title="How it gets better">
              <Bullet>
                <B>Test more of the panel.</B> You’re at{' '}
                <B>
                  {score ? `${score.tested_count} of ${score.total_count}` : 'a partial set of'}
                </B>{' '}
                markers — each new result fills a gap and raises confidence.
              </Bullet>
              <Bullet>
                <B>Move flagged markers toward optimal.</B> The “Holding you back” list has the
                biggest effect — small improvements there lift the whole score.
              </Bullet>
              <Bullet>
                <B>Re-test regularly.</B> Recent results count for more, so staying current keeps
                your score accurate and your confidence high.
              </Bullet>
            </Section>

            <Text className="mt-4 font-body" style={{ color: colors.textMuted, fontSize: 11, lineHeight: 17 }}>
              VITAL is for wellness insight, not medical diagnosis. Discuss results with your doctor.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 11 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-2 flex-row" style={{ gap: 8 }}>
      <Text style={{ color: colors.gold, fontSize: 14, lineHeight: 21 }}>•</Text>
      <Text className="flex-1 font-body" style={{ color: colors.textDim, fontSize: 14, lineHeight: 21 }}>
        {children}
      </Text>
    </View>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: colors.white, fontWeight: '600' }}>{children}</Text>;
}

function DriverList({
  title,
  drivers,
  color,
}: {
  title: string;
  drivers: { name: string; category: string; score: number }[];
  color: string;
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-display" style={{ color: colors.white, fontSize: 18 }}>
        {title}
      </Text>
      {drivers.map((d, i) => (
        <View
          key={`${d.name}-${i}`}
          className="mb-1.5 flex-row items-center justify-between rounded-lg border px-3 py-2.5"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-1">
            <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>
              {d.name}
            </Text>
            <Text className="font-body" style={{ color: colors.textMuted, fontSize: 11 }}>
              {d.category}
            </Text>
          </View>
          <Text className="font-display" style={{ color, fontSize: 16 }}>
            {d.score}
          </Text>
        </View>
      ))}
    </View>
  );
}
