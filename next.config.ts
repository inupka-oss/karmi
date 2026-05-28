import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizeCss: true,
  },
  // Говорим Next.js: "все пути к файлам делай относительными"
  assetPrefix: './',
};

export default nextConfig;