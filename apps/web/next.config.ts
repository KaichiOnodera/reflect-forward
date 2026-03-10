import type { NextConfig } from "next";

// CF Pages ローカル開発用（Cloudflare バインディングを開発サーバーで利用可能にする）
if (process.env.NODE_ENV === "development") {
  import("@cloudflare/next-on-pages/next-dev").then((m) => m.setupDevPlatform());
}

const nextConfig: NextConfig = {
  transpilePackages: ["@reflect-forward/shared"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
