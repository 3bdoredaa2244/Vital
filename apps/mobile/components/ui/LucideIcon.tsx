/**
 * LucideIcon — resolves a Lucide icon by its string name (as stored in the
 * category/biomarker dataset). Falls back to a neutral icon if not found.
 */
import * as Icons from 'lucide-react-native';
import { Circle } from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';

type IconComponent = React.ComponentType<LucideProps>;

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function LucideIcon({ name, size = 20, color = '#D4DCE8', strokeWidth = 2 }: Props) {
  const registry = Icons as unknown as Record<string, IconComponent | undefined>;
  const Icon: IconComponent = registry[name] ?? Circle;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
