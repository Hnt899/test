const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      // добавь домены твоего API/CDN, если другие
    ],
  },
};
export default nextConfig;
