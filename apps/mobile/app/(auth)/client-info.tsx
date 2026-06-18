/**
 * Client info — activity level + home address/location (Google Maps picker).
 * Collected during onboarding, after the health profile.
 */
import type { ActivityLevel } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { LocationPicker, type PickedLocation } from '@/components/LocationPicker';
import { Button, Screen, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

const ACTIVITY: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise' },
  { value: 'light', label: 'Light', hint: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', hint: '3–5 days/week' },
  { value: 'active', label: 'Active', hint: '6–7 days/week' },
  { value: 'very_active', label: 'Very active', hint: 'Hard daily / physical job' },
];

export default function ClientInfo() {
  const router = useRouter();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const onPick = (loc: PickedLocation) => {
    setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    if (loc.address) setAddress(loc.address);
  };

  const onContinue = async () => {
    if (!address.trim()) {
      toast.error('Please enter your address');
      return;
    }
    setSaving(true);
    try {
      await userApi.updateClientInfo({
        activity_level: activity ?? undefined,
        address: address.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      await refreshUser();
      router.replace('/(auth)/goals');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text className="mb-1 mt-6 font-display" style={{ color: colors.white, fontSize: 32 }}>
        A bit about you
      </Text>
      <Text className="mb-6 font-body" style={{ color: colors.textDim, fontSize: 14 }}>
        This helps us tailor guidance and reach you for home tests.
      </Text>

      <Text className="mb-2 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 11 }}>
        Activity level
      </Text>
      <View className="mb-6">
        {ACTIVITY.map((a) => {
          const sel = activity === a.value;
          return (
            <Pressable
              key={a.value}
              onPress={() => setActivity(a.value)}
              className="mb-2 flex-row items-center justify-between rounded-lg border p-3"
              style={{ backgroundColor: sel ? `${colors.gold}1F` : colors.surface, borderColor: sel ? colors.gold : colors.border, minHeight: 52 }}
            >
              <View>
                <Text className="font-body" style={{ color: colors.white, fontSize: 15, fontWeight: sel ? '600' : '400' }}>{a.label}</Text>
                <Text className="font-body" style={{ color: colors.textDim, fontSize: 12 }}>{a.hint}</Text>
              </View>
              {/* Always-visible radio */}
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 20, height: 20, borderWidth: 2, borderColor: sel ? colors.gold : colors.border, backgroundColor: sel ? colors.gold : 'transparent' }}
              >
                {sel ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.obsidian }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 font-mono uppercase tracking-widest" style={{ color: colors.gold, fontSize: 11 }}>
        Home location
      </Text>
      <View className="mb-3">
        <LocationPicker onPick={onPick} initial={coords} />
      </View>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Address (building, street, area)"
        placeholderTextColor={colors.textMuted}
        multiline
        className="mb-6 rounded-lg border p-3 font-body"
        style={{ color: colors.white, borderColor: colors.border, backgroundColor: colors.surface, minHeight: 56, fontSize: 14 }}
      />

      <Button label="Continue" onPress={onContinue} loading={saving} />
    </Screen>
  );
}
