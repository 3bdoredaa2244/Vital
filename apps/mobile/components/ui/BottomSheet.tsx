/**
 * BottomSheet — lightweight reusable bottom sheet built on RN Modal with a
 * dimmed backdrop and a slide-up panel. Keyboard-aware on iOS.
 */
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: '#000000AA' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            // Stop propagation so taps inside the sheet don't close it.
            onPress={() => {}}
            className="rounded-t-lg border-t"
            style={{
              backgroundColor: colors.deep,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
              maxHeight: '85%',
            }}
          >
            <View className="items-center pt-3">
              <View
                className="rounded-full"
                style={{ width: 40, height: 4, backgroundColor: colors.borderLight }}
              />
            </View>
            {title ? (
              <Text
                className="px-5 pb-2 pt-4 font-display"
                style={{ color: colors.white, fontSize: 24 }}
              >
                {title}
              </Text>
            ) : null}
            <ScrollView
              className="px-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
