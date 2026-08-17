import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_ORIGIN ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
