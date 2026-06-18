/**
 * FilterPills — horizontally scrollable single-select pill row.
 */
import { Pressable, ScrollView, Text } from 'react-native';

import { colors } from '@/constants/theme';

export interface PillOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        const accent = opt.color ?? colors.gold;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className="rounded-full border px-4 py-2"
            style={{
              backgroundColor: active ? `${accent}26` : colors.surface,
              borderColor: active ? accent : colors.border,
            }}
          >
            <Text
              className="font-mono"
              style={{ color: active ? accent : colors.textDim, fontSize: 12 }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
