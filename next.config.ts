import type { NextConfig } from "next";

const isDesktopBuild = process.env.DESKTOP_BUILD === "1";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
  ...(isDesktopBuild
    ? {
        assetPrefix: "./",
        distDir: "desktop-out",
        output: "export" as const,
        trailingSlash: true
      }
    : {})
};

export default nextConfig;
