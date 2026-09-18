import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "lighthouse", "chrome-launcher"];
    }
    return config;
  },
};

export default nextConfig;