import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    const internalApiBaseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${internalApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
