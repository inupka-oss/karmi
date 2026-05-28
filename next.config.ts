import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // Разрешаем все домены (для простоты)
      },
    ],
  },
};

export default nextConfig;