// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo (in addition to Expo's defaults) so changes in
// packages/shared hot-reload.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
// With the hoisted node-linker (see ../../.npmrc) dependencies live in the root
// and app-level node_modules, so pointing Metro at both is enough. We keep
// hierarchical lookup enabled (Expo's default) as a harmless fallback.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// `@vital/shared` is an ESM TypeScript package (`"type": "module"`) whose source
// uses NodeNext-style `.js` import specifiers (e.g. `from './types/index.js'`).
// That is correct for Node/Next.js consumers, but Metro resolves the literal
// `.js` path and fails because only the `.ts` source exists. Map a relative
// `.js` specifier to its sibling `.ts`/`.tsx` when (and only when) that source
// file actually exists; everything else falls through to the default resolver.
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const withoutExt = path.resolve(
      path.dirname(context.originModulePath),
      moduleName.slice(0, -3),
    );
    for (const ext of ['.ts', '.tsx']) {
      if (fs.existsSync(withoutExt + ext)) {
        const resolve = upstreamResolveRequest || context.resolveRequest;
        return resolve(context, moduleName.slice(0, -3) + ext, platform);
      }
    }
  }
  const resolve = upstreamResolveRequest || context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
