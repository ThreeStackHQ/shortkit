import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shortkit/db"],
  serverExternalPackages: ["qrcode"],
};

export default nextConfig;
