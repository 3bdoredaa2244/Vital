/**
 * Main tab navigation. Guards on auth (redirect to welcome) and lazily loads
 * the subscription state used by the biomarker screens.
 */
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { LucideIcon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/lib/store/auth';
import { useSubscriptionStore } from '@/lib/store/subscription';

export default function TabsLayout() {
  const status = useAuthStore((s) => s.status);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);

  useEffect(() => {
    if (status === 'authenticated') void fetchSubscription();
  }, [status, fetchSubscription]);

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.deep,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: 'DMMonoLight', fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LucideIcon name="LayoutDashboard" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biomarkers"
        options={{
          title: 'Biomarkers',
          tabBarIcon: ({ color }) => <LucideIcon name="FlaskConical" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <LucideIcon name="User" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
