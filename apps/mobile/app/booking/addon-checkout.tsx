/**
 * Add-on checkout — pay for the extra markers attached to a freshly created
 * booking. Initiates a Paymob order on mount, shows the line items + 14% VAT,
 * then renders the Paymob iframe in a WebView. Success is reconciled server-side
 * via the webhook; the WebView navigation is just the UX signal.
 */
import type { AddonOrder } from '@vital/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { LucideIcon, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, addonApi } from '@/lib/api';
import { useAddonStore } from '@/lib/store/addons';

const egp = (n: number) => `EGP ${n.toLocaleString('en-US')}`;

export default function AddonCheckout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const selected = useAddonStore((s) => s.selected);
  const clear = useAddonStore((s) => s.clear);

  const [order, setOrder] = useState<AddonOrder | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showWeb, setShowWeb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || selected.length === 0) {
      router.back();
      return;
    }
    addonApi
      .initiatePayment(bookingId, selected)
      .then((res) => {
        setOrder(res.order);
        setIframeUrl(res.iframe_url);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not start payment'));
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNavChange = (nav: WebViewNavigation) => {
    const url = nav.url.toLowerCase();
    if (url.includes('success=true') || url.includes('txn_response_code=approved')) {
      setShowWeb(false);
      clear();
      toast.success('Extra tests paid — added to your visit');
      router.replace('/booking');
    } else if (url.includes('success=false') || url.includes('txn_response_code=declined')) {
      setShowWeb(false);
      toast.error('Payment was not completed');
    }
  };

  if (showWeb && iframeUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top }}>
        <Pressable onPress={() => setShowWeb(false)} hitSlop={10} className="px-4 py-3">
          <LucideIcon name="X" size={24} color={colors.white} />
        </Pressable>
        <WebView source={{ uri: iframeUrl }} onNavigationStateChange={onNavChange} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian, paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-4 pb-3" style={{ gap: 10 }}>
        <Pressable onPress={() => router.replace('/booking')} hitSlop={10}>
          <LucideIcon name="ChevronLeft" size={24} color={colors.white} />
        </Pressable>
        <Text className="font-display" style={{ color: colors.white, fontSize: 22 }}>
          Pay for extra tests
        </Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-body" style={{ color: colors.red, fontSize: 14 }}>{error}</Text>
          <Pressable onPress={() => router.replace('/booking')} className="mt-4 rounded-lg px-5 py-3" style={{ backgroundColor: colors.surface }}>
            <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>Back to booking</Text>
          </Pressable>
        </View>
      ) : !order ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text className="mb-3 font-body" style={{ color: colors.textDim, fontSize: 13 }}>
              Your booking is confirmed. These extra markers are billed separately from your plan.
            </Text>
            <View className="rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {order.items.map((it) => (
                <View key={it.biomarker_id} className="flex-row items-center justify-between py-1.5">
                  <Text className="font-body" style={{ color: colors.white, fontSize: 14 }}>{it.name}</Text>
                  <Text className="font-mono" style={{ color: colors.text, fontSize: 13 }}>{egp(it.price_egp)}</Text>
                </View>
              ))}
              <View className="my-2 h-px" style={{ backgroundColor: colors.border }} />
              <Row label="Subtotal" value={egp(order.subtotal_egp)} />
              <Row label="VAT (14%)" value={egp(order.vat_egp)} />
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="font-display" style={{ color: colors.white, fontSize: 16 }}>Total</Text>
                <Text className="font-display" style={{ color: colors.white, fontSize: 20 }}>{egp(order.total_egp)}</Text>
              </View>
            </View>
          </ScrollView>

          <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: insets.bottom + 16 }}>
            <Pressable onPress={() => setShowWeb(true)} className="items-center rounded-lg py-4" style={{ backgroundColor: colors.gold }}>
              <Text className="font-display" style={{ color: colors.obsidian, fontSize: 16 }}>
                Pay {egp(order.total_egp)}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/booking')} className="mt-2 items-center py-2">
              <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>Pay later</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>{label}</Text>
      <Text className="font-mono" style={{ color: colors.text, fontSize: 13 }}>{value}</Text>
    </View>
  );
}
