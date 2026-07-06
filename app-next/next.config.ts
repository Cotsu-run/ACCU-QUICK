import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-only on-screen indicator (it overlapped the sidebar logout chip).
  devIndicators: false,
};

export default nextConfig;
