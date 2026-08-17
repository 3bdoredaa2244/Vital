/**
 * VITAL design tokens for non-Tailwind code (SVG charts, inline styles).
 * A thin, typed re-export of the SINGLE SOURCE OF TRUTH in `lib/tokens.js` —
 * do NOT define colors here.
 */
import type { BiomarkerStatus } from '@vital/shared';

/** The semantic colour roles defined in `lib/tokens.js`. */
export interface VitalColors {
  canvas: string;
  panelWarm: string;
  panel: string;
  card: string;
  panelSlate: string;
  slate: string;
  line: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  green: string;
  greenInk: string;
  amber: string;
  rust: string;
  untested: string;
  accent: string;
  accentSoft: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tokens = require('./tokens') as {
  colors: VitalColors;
  status: Record<BiomarkerStatus, string>;
};

/** Color tokens — semantic roles (canvas, ink, accent, line, …). */
export const colors: VitalColors = tokens.colors;

/** Status → color, sourced from the active theme (mirrors STATUS_COLORS). */
export const statusColors: Record<BiomarkerStatus, string> = tokens.status;
