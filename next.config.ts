// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      // добавь свой CDN/домен, если другой
    ],
  },
};

export default nextConfig;
