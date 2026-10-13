import type { NextConfig } from "next";

let rawBackend = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();

// Sanitize against dead or unverified hosts
if (
  !rawBackend ||
  (!rawBackend.startsWith("https://athena-ai-wellness.onrender.com") && process.env.NODE_ENV === "production")
) {
  rawBackend = process.env.NODE_ENV === "production"
    ? "https://athena-ai-wellness.onrender.com"
    : "http://127.0.0.1:8001";
}

const backendUrl = rawBackend.replace(/\/+$/, "");

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

