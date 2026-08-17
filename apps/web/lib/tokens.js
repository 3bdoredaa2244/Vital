/**
 * ============================================================================
 *  VITAL WEB — THEME SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 *  ▶ TO RE-SKIN THE ENTIRE WEB APP, EDIT ONLY THIS FILE.
 *
 *  This mirrors `apps/mobile/constants/tokens.js` role-for-role so the web
 *  client and the mobile app read as the same product. It is deliberately a
 *  standalone copy rather than a cross-app import: `apps/web` must not depend
 *  on the Expo app's build graph. If you change a value in the mobile tokens
 *  file, change it here too (the role names are identical, so it's a 1:1 edit).
 *
 *  Both `tailwind.config.ts` (utility classes) and `lib/theme.ts` (inline
 *  styles / SVG charts) read from here.
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
    accent: '#C2603C', // active nav, links, selected (clay / terracotta)
    accentSoft: '#E0A98C', // lighter accent (hover/tint edges)
  },
};

const ACTIVE_THEME = 'warmPaper';
const t = themes[ACTIVE_THEME];

// ── Semantic roles ──────────────────────────────────────────────────────────
const semantic = {
  canvas: t.canvas,
  panelWarm: t.panelWarm,
  // `panel` alias matches the naming already used by apps/admin + apps/partner.
  panel: t.panelWarm,
  card: t.card,
  panelSlate: t.panelSlate,
  slate: t.panelSlate,
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

const colors = { ...semantic };

// Status → color (mirrors @vital/shared STATUS_COLORS so SVG/chart code and
// Tailwind agree with the active theme).
const status = {
  optimal: t.green,
  suboptimal: t.amber,
  alert: t.rust,
  untested: t.untested,
};

// Tight, editorial radii — the same scale the mobile app uses.
const radiusCss = { sm: '2px', md: '4px', lg: '8px' };

const fontFamily = {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  body: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  // The "mono" role is Inter used uppercase with wide tracking — the VITAL
  // eyebrow/label/button signature. It is not a monospaced face.
  mono: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  display: ['var(--font-display)', 'Georgia', 'serif'],
};

module.exports = {
  ACTIVE_THEME,
  themes,
  colors,
  status,
  radiusCss,
  fontFamily,
};
