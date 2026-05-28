import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Отключаем некоторые строгости, ускоряющие сборку
    optimizeCss: true,
  },
};

export default nextConfig;