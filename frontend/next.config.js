const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { 
    ignoreBuildErrors: true 
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  webpack: (config, { isServer }) => {
    // Ensure `@/` path alias resolves to `src/` during webpack builds
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    if (isServer) {
      // Exclude Firebase from server-side bundle
      config.externals.push({
        'firebase/app': 'commonjs firebase/app',
        'firebase/auth': 'commonjs firebase/auth',
      });
    } else {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase/app', 'firebase/auth', 'undici'],
  },
}

module.exports = nextConfig
