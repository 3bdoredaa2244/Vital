import type { Config } from 'tailwindcss';

// Colors, fonts, and radii come from the SINGLE SOURCE OF TRUTH in
// `lib/tokens.js` (which mirrors apps/mobile/constants/tokens.js). To re-skin
// the web app, edit that file — never hardcode theme values here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tokens = require('./lib/tokens');

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      borderRadius: tokens.radiusCss,
      letterSpacing: {
        // The VITAL eyebrow tracking, matching the mobile `tracking-widest`.
        eyebrow: '0.12em',
      },
      keyframes: {
        'vital-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        'vital-in': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'vital-pulse': 'vital-pulse 1.6s ease-in-out infinite',
        'vital-in': 'vital-in 160ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
