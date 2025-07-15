export default {
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
  webpack: (config: any) => {
    config.experiments = {
      topLevelAwait: true,
      layers: true,
    };
    return config;
  },
  reactStrictMode: false,
};
