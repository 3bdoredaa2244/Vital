/**
 * ============================================================================
 *  VITAL — THEME SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 *  ▶ Claude design: TO RE-SKIN THE ENTIRE APP, EDIT ONLY THIS FILE.
 *
 *  Both inline styles (`constants/theme.ts`) and Tailwind/NativeWind utility
 *  classes (`tailwind.config.js`) read their colors and fonts from here, so a
 *  single change updates every screen — no need to touch the ~330 existing
 *  `colors.<name>` call sites or any `bg-`, `text-`, `border-` classes.
 *
 *  THREE WAYS TO OVERRIDE
 *  ----------------------
 *  1. Tweak values   → edit the active theme object below (e.g. `warmPaper`).
 *  2. Swap a palette → change `ACTIVE_THEME` to another key in `themes`.
 *  3. New direction  → add a theme object (same role keys) and point
 *                      `ACTIVE_THEME` at it.
 *
 *  HOW EXISTING SCREENS KEEP WORKING
 *  ---------------------------------
 *  Screens were written against the original dark vocabulary
 *  (`colors.obsidian`, `colors.gold`, `colors.white`, ...). The LEGACY ALIAS
 *  layer at the bottom maps each old name onto a SEMANTIC ROLE in the active
 *  theme. Because the mapping preserves roles (background→background,
 *  primary-text→primary-text, accent→accent), the light/dark relationship and
 *  contrast stay correct when you swap palettes. New code should prefer the
 *  semantic role names (canvas, ink, inkSoft, accent, line, ...).
 * ============================================================================
 */

// ── Theme palettes (keyed by SEMANTIC ROLE) ────────────────────────────────
const themes = {
  // Warm Paper — the active VITAL direction (see DESIGN_HANDOFF.md §2–3).
  warmPaper: {
    // canvas & surfaces
    canvas: '#FBF6EC', // app background — warm cream "paper"
    panelWarm: '#F3EAD9', // sectioned / inset background, subtle grouping
    card: '#FFFFFF', // raised cards (use sparingly — prefer dividers)
    panelSlate: '#6E8BA0', // accent feature panel (muted slate blue)
    line: '#E7DECC', // hairline dividers & borders

    // ink (text)
    ink: '#20201C', // primary text & headings (warm near-black)
    inkSoft: '#6B6459', // secondary / body-dim
    inkMuted: '#A79E8D', // tertiary, placeholders, captions

    // status (data only — never interactive chrome)
    green: '#6FA97D', // optimal / in range
    greenInk: '#3E7A53', // optimal big-number emphasis
    amber: '#CDA24E', // suboptimal / review
    rust: '#C2603C', // alert / out of range
    untested: '#B6AD9C', // no result yet

    // brand / interactive accent
    accent: '#C2603C', // active tab, links, selected (clay / terracotta)
    accentSoft: '#E0A98C', // lighter accent (hover/tint edges)

    fonts: { display: 'BricolageGrotesque', body: 'Inter', mono: 'Inter' },
  },

  // Legacy Dark — the original v1 direction. Kept for safe rollback / compare.
  legacyDark: {
    canvas: '#090B0E',
    panelWarm: '#131920',
    card: '#0D1117',
    panelSlate: '#4A9FB5',
    line: '#1E2830',

    ink: '#F0F4F8',
    inkSoft: '#7A8FA6',
    inkMuted: '#3D5068',

    green: '#4CAF84',
    greenInk: '#4CAF84',
    amber: '#C9A84C',
    rust: '#E05252',
    untested: '#3D5068',

    accent: '#C9A84C',
    accentSoft: '#E8C878',

    fonts: { display: 'CormorantGaramond', body: 'InstrumentSans', mono: 'DMMonoLight' },
  },
};

// ── Active theme switch (flip this one line to swap the whole palette) ──────
const ACTIVE_THEME = 'warmPaper';

const t = themes[ACTIVE_THEME];

// ── Semantic roles (preferred vocabulary for NEW code) ─────────────────────
const semantic = {
  canvas: t.canvas,
  panelWarm: t.panelWarm,
  card: t.card,
  panelSlate: t.panelSlate,
  line: t.line,
  ink: t.ink,
  inkSoft: t.inkSoft,
  inkMuted: t.inkMuted,
  green: t.green,
  greenInk: t.greenInk,
  amber: t.amber,
  rust: t.rust,
  untested: t.untested,
  accent: t.accent,
  accentSoft: t.accentSoft,
};

// ── Legacy aliases (old vocabulary → active semantic role) ──────────────────
// These keep every pre-redesign `colors.<oldName>` call site working AND
// re-skinning automatically when the active theme changes.
const legacyAliases = {
  obsidian: t.canvas, // app background
  deep: t.card, // raised background
  surface: t.panelWarm, // card / inset background
  border: t.line, // borders
  borderLight: t.line, // lighter borders
  gold: t.accent, // brand accent
  goldLight: t.accentSoft, // accent (light)
  goldDim: t.accent, // accent (dim)
  text: t.ink, // primary body text
  textDim: t.inkSoft, // secondary text
  textMuted: t.inkMuted, // tertiary text
  white: t.ink, // headings / strong emphasis (foreground)
  red: t.rust, // alert
  green: t.green, // optimal (already a role; kept for clarity)
  cyan: t.panelSlate, // secondary accent panel
};

// ── Public maps consumed by theme.ts AND tailwind.config.js ─────────────────
const colors = { ...semantic, ...legacyAliases };

const fontFamily = {
  display: [t.fonts.display],
  body: [t.fonts.body],
  mono: [t.fonts.mono],
};

// Status → color (mirrors @vital/shared STATUS_COLORS; kept here so SVG/chart
// code and Tailwind agree with the active theme).
const status = {
  optimal: t.green,
  suboptimal: t.amber,
  alert: t.rust,
  untested: t.untested,
};

const radius = { sm: 2, md: 4, lg: 8 };
const radiusCss = { sm: '2px', md: '4px', lg: '8px' };
const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

module.exports = {
  ACTIVE_THEME,
  themes,
  colors,
  fontFamily,
  fonts: t.fonts,
  status,
  radius,
  radiusCss,
  spacing,
};
