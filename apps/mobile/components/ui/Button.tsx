/**
 * Button — primary/secondary/ghost variants with loading + disabled states.
 */
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { LucideIcon } from './LucideIcon';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary' ? colors.gold : variant === 'secondary' ? colors.surface : 'transparent';
  const fg = variant === 'primary' ? colors.obsidian : colors.white;
  const border = variant === 'secondary' ? colors.borderLight : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="items-center justify-center rounded-md py-3.5"
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: variant === 'secondary' ? 1 : 0,
        opacity: isDisabled ? 0.5 : 1,
        alignSelf: fullWidth ? 'stretch' : 'auto',
        paddingHorizontal: fullWidth ? 0 : 24,
      }}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <LucideIcon name={icon} size={16} color={fg} /> : null}
          <Text
            className="font-mono uppercase tracking-wider"
            style={{ color: fg, fontSize: 13, marginLeft: icon ? 8 : 0 }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
