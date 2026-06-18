/**
 * Toast — minimal app-wide toast for surfacing API errors and successes.
 * Exposes a `toast` imperative API plus a <ToastHost/> to mount once at root.
 */
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type ToastKind = 'error' | 'success' | 'info';
interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

let pushFn: ((kind: ToastKind, text: string) => void) | null = null;
let counter = 0;

export const toast = {
  error: (text: string) => pushFn?.('error', text),
  success: (text: string) => pushFn?.('success', text),
  info: (text: string) => pushFn?.('info', text),
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    pushFn = (kind, text) => {
      const id = ++counter;
      setMessages((prev) => [...prev, { id, kind, text }]);
      setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== id)), 3500);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 1000 }}
    >
      {messages.map((m) => {
        const accent =
          m.kind === 'error' ? colors.red : m.kind === 'success' ? colors.green : colors.cyan;
        return (
          <Animated.View
            key={m.id}
            entering={FadeInUp}
            exiting={FadeOutUp}
            className="mb-2 rounded-md border px-4 py-3"
            style={{ backgroundColor: colors.surface, borderColor: accent }}
          >
            <Text className="font-body" style={{ color: colors.white, fontSize: 13 }}>
              {m.text}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
