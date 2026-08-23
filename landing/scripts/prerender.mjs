/**
 * Post-build prerender.
 *
 * The landing page is a single route with no server-side data, so the whole
 * site can be static. TanStack Start's own prerenderer requires a hosting
 * adapter (@tanstack/nitro-v2-vite-plugin), whose published version is behind
 * @tanstack/react-start and breaks the server build. Instead we call the
 * server bundle Vite already produced — it exports a standard Web `fetch`
 * handler — and write its HTML to the client output.
 *
 * Result: dist/client is a complete static site (real SSR markup, so the
 * Open Graph / meta tags from __root.tsx are visible to crawlers that don't
 * execute JavaScript), deployable to Vercel with no serverless function.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const clientDir = join(root, 'dist', 'client');
const serverEntry = join(root, 'dist', 'server', 'server.js');

/** Routes to emit. The landing page is a single page. */
const ROUTES = ['/'];

const { default: server } = await import(pathToFileURL(serverEntry).href);

let failed = false;

for (const route of ROUTES) {
  const response = await server.fetch(new Request(`http://localhost${route}`));
  const html = await response.text();

  if (!response.ok) {
    console.error(`prerender: ${route} returned ${response.status}`);
    failed = true;
    continue;
  }
  if (!html.includes('<html')) {
    console.error(`prerender: ${route} did not return an HTML document`);
    failed = true;
    continue;
  }

  // "/" -> index.html, "/foo" -> foo/index.html
  const outPath =
    route === '/'
      ? join(clientDir, 'index.html')
      : join(clientDir, route.replace(/^\//, ''), 'index.html');

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html, 'utf8');
  console.log(`prerender: ${route} -> ${outPath.replace(root, '.')} (${html.length} bytes)`);
}

if (failed) process.exit(1);
