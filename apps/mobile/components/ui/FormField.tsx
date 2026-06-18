/**
 * FormField — labelled text input wired for react-hook-form via Controller.
 * Shows inline validation errors from the resolver.
 */
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors } from '@/constants/theme';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
}: Props<T>) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim, fontSize: 11 }}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value != null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            className="rounded-md border px-4 py-3 font-body"
            style={{
              backgroundColor: colors.surface,
              borderColor: error ? colors.red : colors.border,
              color: colors.white,
              fontSize: 15,
            }}
          />
        )}
      />
      {error ? (
        <Text className="mt-1 font-body" style={{ color: colors.red, fontSize: 12 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
