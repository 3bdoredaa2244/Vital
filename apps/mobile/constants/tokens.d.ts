/**
 * Types for the CommonJS theme token source (`tokens.js`). The runtime values
 * live in the .js so that both TypeScript (via these types) and the
 * Tailwind/NativeWind config (via require) can share one source of truth.
 */
import type { BiomarkerStatus } from '@vital/shared';

/** Semantic + legacy color keys. All keys are declared so `colors.<name>` is
 *  always `string` (never `string | undefined` under noUncheckedIndexedAccess). */
export type ColorTokens = {
  // semantic roles (prefer these in new code)
  canvas: string;
  panelWarm: string;
  card: string;
  panelSlate: string;
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
  // legacy aliases (mapped onto active-theme roles in tokens.js)
  obsidian: string;
  deep: string;
  surface: string;
  border: string;
  borderLight: string;
  gold: string;
  goldLight: string;
  goldDim: string;
  text: string;
  textDim: string;
  textMuted: string;
  white: string;
  red: string;
  cyan: string;
};

export const ACTIVE_THEME: string;
export const themes: Record<string, Record<string, unknown>>;
export const colors: ColorTokens;
export const fontFamily: { display: string[]; body: string[]; mono: string[] };
export const fonts: { display: string; body: string; mono: string };
export const status: Record<BiomarkerStatus, string>;
export const radius: { sm: number; md: number; lg: number };
export const radiusCss: { sm: string; md: string; lg: string };
export const spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
