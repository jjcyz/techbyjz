import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images for Sanity CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
  },

  // Optimize webpack for Sanity Studio SSR issues
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Ignore jsdom's CSS file import (it's not needed for SSR)
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /default-stylesheet\.css$/,
        })
      );

      // Prevent fs from being bundled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    return config;
  },

  // Transpile Sanity packages to ensure compatibility
  transpilePackages: ['next-sanity'],

  // External packages for server components (moved from experimental in Next.js 16)
  serverExternalPackages: ['@sanity/vision'],

  // Note: output: 'standalone' is not needed for Vercel - it handles this automatically
  // SWC minification is enabled by default in Next.js 16, no need to configure

  // Add empty turbopack config to silence warning when using webpack
  // This is needed because Next.js 16 uses Turbopack by default, but we need webpack for Sanity
  turbopack: {},

  // Optimize compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['@sanity/ui', '@sanity/client', '@portabletext/react'],
  },
};

export default nextConfig;
