import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Landing runs on 3004 so it never collides with the API (3000) or the
  // authenticated web app (3003).
  server: { port: 3004 },
  preview: { port: 3004 },
  resolve: {
    // This workspace runs two React majors: 19 here and in apps/mobile, 18 in
    // the three Next.js apps. The repo root hoists React 18 (see the root
    // package.json devDependencies) so that `next` and `styled-jsx` share one
    // instance. That leaves the @tanstack/* packages — which live in the root
    // node_modules — resolving React 18 while this app's own code resolves the
    // React 19 in landing/node_modules. Two instances means two hook
    // dispatchers, and SSR dies with
    //   TypeError: Cannot read properties of null (reading 'useEffect')
    // inside renderToPipeableStream.
    //
    // `dedupe` forces every react / react-dom import in the graph onto this
    // app's copy (19.1.0). No versions change.
    dedupe: ['react', 'react-dom'],
  },
  ssr: {
    // dedupe only governs what Vite bundles. SSR externalises dependencies by
    // default, so the @tanstack/* packages would be resolved by Node at
    // runtime from the root node_modules — picking up React 18 again. Bundling
    // them brings them under `resolve.dedupe`.
    noExternal: [/^@tanstack\//],
  },
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
