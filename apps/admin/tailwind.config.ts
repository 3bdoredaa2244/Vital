import type { Config } from 'tailwindcss';

// Warm-paper / green-pastel palette, consistent with the VITAL app redesign.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FBF6EC',
        panel: '#F3EAD9',
        card: '#FFFFFF',
        line: '#E7DECC',
        ink: '#20201C',
        inkSoft: '#6B6459',
        inkMuted: '#A79E8D',
        green: '#6FA97D',
        greenInk: '#3E7A53',
        amber: '#CDA24E',
        rust: '#C2603C',
        slate: '#6E8BA0',
        accent: '#6FA97D',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
