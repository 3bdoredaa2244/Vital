/** @type {import('tailwindcss').Config} */
// Colors, fonts, and radii come from the SINGLE SOURCE OF TRUTH in
// `constants/tokens.js`. To re-skin the app, edit that file — never hardcode
// theme values here. `colors` includes both semantic roles (canvas, ink,
// accent, line, …) and legacy aliases (obsidian, gold, white, …), so existing
// `bg-*/text-*/border-*` classes keep working through a palette swap.
const tokens = require('./constants/tokens');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      borderRadius: tokens.radiusCss,
    },
  },
  plugins: [],
};
