/**
 * StatusBadge — colored pill for a biomarker status (optimal/review/alert/untested).
 */
import { STATUS_LABELS, type BiomarkerStatus } from '@vital/shared';
import { Text, View } from 'react-native';

import { statusColors } from '@/constants/theme';

interface Props {
  status: BiomarkerStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const color = statusColors[status];
  return (
    <View
      className={`flex-row items-center rounded-sm ${size === 'sm' ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}`}
      style={{ backgroundColor: `${color}1A`, borderColor: color, borderWidth: 1 }}
    >
      <View
        className="mr-1.5 rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color }}
      />
      <Text
        className="font-mono uppercase tracking-wider"
        style={{ color, fontSize: size === 'sm' ? 9 : 11 }}
      >
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
