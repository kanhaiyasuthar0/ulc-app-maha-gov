import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    authInterrupts: true,
  },
  serverExternalPackages: [
    "pdf-parse",
    "mongoose",
    "mongoose/dist/browser.umd.js",
  ],
  webpack: (config) => {
    config.experiments = {
      topLevelAwait: true,
      layers: true,
    };
    return config;
  },
  reactStrictMode: false,
};

export default nextConfig;
