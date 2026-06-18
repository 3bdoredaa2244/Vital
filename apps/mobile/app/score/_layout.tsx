import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function ScoreLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.obsidian } }}
    />
  );
}
