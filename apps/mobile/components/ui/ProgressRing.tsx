/**
 * ProgressRing — circular progress indicator (e.g. % of a category's biomarkers
 * in optimal range). Pure SVG so it works on iOS/Android/web.
 */
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/constants/theme';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  color = colors.green,
  trackColor = colors.border,
  label,
  sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start at 12 o'clock.
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="font-display" style={{ color: colors.white, fontSize: size * 0.26 }}>
          {label ?? `${Math.round(clamped * 100)}%`}
        </Text>
        {sublabel ? (
          <Text className="font-mono" style={{ color: colors.textDim, fontSize: 9 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
