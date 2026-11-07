import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', 'pdf-parse', 'xlsx', 'mammoth'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
