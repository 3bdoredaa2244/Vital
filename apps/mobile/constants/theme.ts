/**
 * VITAL design tokens for non-Tailwind code (SVG charts, inline styles,
 * Reanimated). This is a thin, typed re-export of the SINGLE SOURCE OF TRUTH in
 * `constants/tokens.js` — do NOT define colors/fonts here.
 *
 * ▶ Claude design: to re-skin the app, edit `constants/tokens.js` (one file).
 *   It drives both these tokens and the Tailwind/NativeWind classes.
 */
import * as tokens from './tokens';

/** Color tokens — semantic roles (canvas, ink, accent, line, …) plus legacy
 *  aliases (obsidian, gold, white, …) mapped onto the active theme's roles. */
export const colors = tokens.colors;

/** Font family names for the active theme (display / body / mono). */
export const fonts = tokens.fonts;

export const radius = tokens.radius;

export const spacing = tokens.spacing;

/** Status → color, sourced from the active theme (mirrors @vital/shared
 *  STATUS_COLORS). */
export const statusColors = tokens.status;
