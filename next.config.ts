import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Временно игнорируем ошибки TypeScript при сборке
    ignoreBuildErrors: true,
  },
};

export default nextConfig;