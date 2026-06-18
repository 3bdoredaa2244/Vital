/**
 * VITAL brand logo — the design-system colour mark (ring + wordmark) as a
 * baked PNG, so it renders identically everywhere regardless of fonts.
 */
import { Image } from 'react-native';

const LOGO = require('../assets/vital-logo.png');
const RATIO = 324 / 272; // intrinsic height / width of the trimmed logo

export function VitalLogo({ size = 120 }: { size?: number }) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size * RATIO }}
      resizeMode="contain"
      accessibilityLabel="VITAL"
    />
  );
}
