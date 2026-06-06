import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shikimorg.one',
      },
      {
        protocol: 'https',
        hostname: 'desu.shikimorg.one',
      },
      {
        protocol: 'https',
        hostname: '*.giphy.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'avatars.mds.yandex.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Оптимизация производительности
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;