/**
 * Checkout — order summary with 14% VAT breakdown, terms acceptance, and
 * Pay Now → Paymob. The Paymob iframe is rendered in a WebView; we watch
 * navigation for the success/failure callback and reconcile via the backend
 * webhook (the WebView result is just a UX signal).
 */
import type { SubscriptionPlan } from '@vital/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { Button, LucideIcon, Screen, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, subscriptionApi } from '@/lib/api';
import { useSubscriptionStore } from '@/lib/store/subscription';

const VAT_RATE = 0.14;
const PAYMENT_METHODS = [
  { icon: 'CreditCard', label: 'Credit / Debit card' },
  { icon: 'Smartphone', label: 'Vodafone Cash' },
  { icon: 'Receipt', label: 'Fawry' },
  { icon: 'CreditCard', label: 'Meeza card' },
];

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text
        className="font-body"
        style={{ color: bold ? colors.white : colors.textDim, fontSize: bold ? 15 : 13 }}
      >
        {label}
      </Text>
      <Text
        className={bold ? 'font-display' : 'font-mono'}
        style={{ color: bold ? colors.white : colors.text, fontSize: bold ? 20 : 13 }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const refreshSubscription = useSubscriptionStore((s) => s.fetch);

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    subscriptionApi
      .plans()
      .then((res) => setPlan(res.plans.find((p) => p.id === planId) ?? null))
      .catch(() => toast.error('Could not load plan'));
  }, [planId]);

  const subtotal = plan?.price_egp ?? 0;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  const onPay = async () => {
    if (!plan) return;
    if (!accepted) {
      toast.info('Please accept the terms to continue');
      return;
    }
    setPaying(true);
    try {
      const res = await subscriptionApi.initiatePayment(plan.id);
      setIframeUrl(res.iframe_url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start payment');
    } finally {
      setPaying(false);
    }
  };

  const onNavChange = async (nav: WebViewNavigation) => {
    const url = nav.url.toLowerCase();
    if (url.includes('success=true') || url.includes('txn_response_code=approved')) {
      setIframeUrl(null);
      await refreshSubscription();
      router.replace('/subscription/confirmation');
    } else if (url.includes('success=false') || url.includes('error')) {
      setIframeUrl(null);
      toast.error('Payment was not completed. Please try again.');
    }
  };

  // ── Paymob iframe view ──
  if (iframeUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top }}>
        <Pressable className="flex-row items-center px-5 py-3" onPress={() => setIframeUrl(null)}>
          <LucideIcon name="X" size={20} color={colors.white} />
          <Text className="ml-2 font-body" style={{ color: colors.white, fontSize: 15 }}>
            Cancel payment
          </Text>
        </Pressable>
        <WebView
          source={{ uri: iframeUrl }}
          onNavigationStateChange={onNavChange}
          startInLoadingState
          renderLoading={() => (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.obsidian }}>
              <ActivityIndicator color={colors.gold} />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <Screen scroll>
      <Text className="mb-6 mt-6 font-display" style={{ color: colors.white, fontSize: 32 }}>
        Checkout
      </Text>

      {plan ? (
        <>
          {/* Plan summary */}
          <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 12 }}>
              {plan.name} plan
            </Text>
            <Text className="mt-1 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
              {plan.annual_tests_count} tests / year · {plan.biomarker_count}+ biomarkers
            </Text>
            <View className="my-3" style={{ height: 1, backgroundColor: colors.border }} />
            <Line label="Subtotal" value={`${subtotal.toLocaleString()} EGP`} />
            <Line label={`VAT (${Math.round(VAT_RATE * 100)}%)`} value={`${vat.toLocaleString()} EGP`} />
            <View className="my-2" style={{ height: 1, backgroundColor: colors.border }} />
            <Line label="Total" value={`${total.toLocaleString()} EGP`} bold />
          </View>

          {/* Payment methods */}
          <Text className="mb-3 mt-6 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 12 }}>
            Payment method
          </Text>
          <View className="rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {PAYMENT_METHODS.map((m, i) => (
              <View
                key={m.label}
                className="flex-row items-center px-4 py-3.5"
                style={{ borderColor: colors.border, borderBottomWidth: i < PAYMENT_METHODS.length - 1 ? 1 : 0 }}
              >
                <LucideIcon name={m.icon} size={18} color={colors.textDim} />
                <Text className="ml-3 font-body" style={{ color: colors.text, fontSize: 14 }}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
          <Text className="mt-2 font-body" style={{ color: colors.textMuted, fontSize: 12 }}>
            You'll choose and confirm your method securely on the next screen.
          </Text>

          {/* Terms */}
          <Pressable className="mt-6 flex-row items-center" onPress={() => setAccepted((a) => !a)}>
            <View
              className="mr-3 items-center justify-center rounded-sm border"
              style={{
                width: 22,
                height: 22,
                borderColor: accepted ? colors.gold : colors.borderLight,
                backgroundColor: accepted ? colors.gold : 'transparent',
              }}
            >
              {accepted ? <LucideIcon name="Check" size={14} color={colors.obsidian} /> : null}
            </View>
            <Text className="flex-1 font-body" style={{ color: colors.text, fontSize: 13 }}>
              I agree to the Terms of Service and authorize this payment.
            </Text>
          </Pressable>

          <View className="mt-6">
            <Button label={`Pay ${total.toLocaleString()} EGP`} onPress={onPay} loading={paying} disabled={!accepted} />
          </View>
        </>
      ) : (
        <ActivityIndicator color={colors.gold} />
      )}
    </Screen>
  );
}
