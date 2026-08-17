/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @vital/shared is consumed straight from TypeScript source in the monorepo.
  transpilePackages: ['@vital/shared'],
  webpack: (config) => {
    // Resolve the shared barrel's NodeNext ".js" re-exports to their ".ts"
    // sources on a cold build (runtime imports of @vital/shared otherwise fail).
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
