import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Landing runs on 3004 so it never collides with the API (3000) or the
  // authenticated web app (3003).
  server: { port: 3004 },
  preview: { port: 3004 },
  plugins: [
    tailwindcss(),
    // The landing page is a single static marketing route with no backend
    // calls, so prerender it to HTML at build time. Vercel then serves plain
    // static files (no serverless function), and crawlers get fully rendered
    // markup including the SEO head from __root.tsx.
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true },
      pages: [{ path: '/' }],
    }),
    react(),
  ],
});
