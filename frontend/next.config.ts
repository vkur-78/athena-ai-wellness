import type { NextConfig } from "next";

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "https://athena-ai-wellness.onrender.com" : "http://127.0.0.1:8001")
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  devIndicators: false,
  async rewrites() {
    if (!backendUrl) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[Athena Production Warning] BACKEND_URL is not configured. /api proxy rewrites are disabled."
        );
      }
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

