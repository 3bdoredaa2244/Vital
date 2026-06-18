/**
 * Root layout. Sets up gesture handling, safe-area + toast host, and the
 * top-level navigation stack. Hydrates the auth session on launch.
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/lib/store/auth';
import '../global.css';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  // Brand fonts. Registered under both the app's family names (display/body =
  // BricolageGrotesque/Inter) and the spaced name the logo SVG uses.
  const [fontsLoaded] = useFonts({
    BricolageGrotesque: require('../assets/fonts/BricolageGrotesque.ttf'),
    'Bricolage Grotesque': require('../assets/fonts/BricolageGrotesque.ttf'),
    Inter: require('../assets/fonts/Inter.ttf'),
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.obsidian },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="biomarker" />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
