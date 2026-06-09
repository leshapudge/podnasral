import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрыть кнопку «N» (Next.js Dev Tools) в dev-режиме
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io", pathname: "/**" },
      { protocol: "https", hostname: "assets.mcasset.cloud", pathname: "/**" },
      { protocol: "https", hostname: "mc-heads.net", pathname: "/**" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com", pathname: "/**" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net", pathname: "/**" },
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
