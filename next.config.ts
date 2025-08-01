import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
  serverExternalPackages: ['pdf-to-img', 'pdfjs-dist'],
};

export default nextConfig;
