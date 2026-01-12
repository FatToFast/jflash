import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  output: "standalone",

  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },

  // Disable image optimization for static deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
