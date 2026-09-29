import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. 'unsafe-inline' is required for Next's inline
// hydration/bootstrap scripts and styles (no nonce pipeline here). 'unsafe-eval'
// and ws: are dev-only (react-refresh HMR needs them); production stays stricter.
// connect-src allows the browser's read calls to the BSC RPC + 0G Storage indexer; the
// Gemini/Hermes API calls happen server-side, so they don't need an entry.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' https://data-seed-prebsc-1-s1.bnbchain.org:8545 https://bsc-dataseed.bnbchain.org ${process.env.NEXT_PUBLIC_BSC_RPC_URL ?? ""} https://indexer-storage-turbo.0g.ai${isDev ? " ws:" : ""}`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
