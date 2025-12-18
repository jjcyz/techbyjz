import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
  // Fix for Sanity Studio SSR issues with jsdom's default-stylesheet.css
  webpack: (config, { isServer }) => {
    if (isServer) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpack = require('webpack');

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
    return config;
  },
  // Transpile Sanity packages to ensure compatibility
  transpilePackages: ['next-sanity'],
  // External packages for server components (moved from experimental in Next.js 16)
  serverExternalPackages: ['@sanity/vision'],
};

export default nextConfig;
