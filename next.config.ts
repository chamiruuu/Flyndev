import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static output: deployable to Cloudflare Pages or Vercel unchanged.
  output: "export",
  // The export target has no image optimiser; brand images are pre-sized in /public.
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
