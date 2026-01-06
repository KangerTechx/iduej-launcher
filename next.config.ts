import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  assetPrefix: "",
  basePath: "",
  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
