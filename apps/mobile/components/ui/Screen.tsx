/**
 * Screen — base safe-area container with the app background. `scroll` wraps
 * children in a ScrollView for long-form pages.
 */
import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll, padded = true, edges = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: edges ? insets.top : 0,
    paddingHorizontal: padded ? 20 : 0,
  };

  if (scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
        <ScrollView
          contentContainerStyle={[
            { paddingBottom: insets.bottom + 40 },
            pad,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: colors.obsidian }, pad, contentStyle]}>{children}</View>
  );
}
