import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    // Enable any experimental features that might help with Tailwind CSS v4
    serverComponentsExternalPackages: ['tailwindcss', '@tailwindcss/postcss'],
  },
};

export default nextConfig;
