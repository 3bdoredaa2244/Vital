/**
 * Entry route. Routes the user based on auth status:
 *   - not authenticated → welcome
 *   - authenticated     → main tabs (the tabs layout further guards on
 *                          subscription state)
 */
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAuthStore } from '@/lib/store/auth';

export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.obsidian }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
