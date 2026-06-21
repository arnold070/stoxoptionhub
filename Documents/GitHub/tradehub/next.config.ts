import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://code.jivosite.com https://*.jivosite.com https://embed.tawk.to https://*.tawk.to https://client.crisp.chat https://widget.intercom.io",
      "style-src 'self' 'unsafe-inline' https://*.jivosite.com",
      "img-src 'self' data: blob: https://*.jivosite.com https://*.tawk.to",
      "font-src 'self' https://fonts.gstatic.com https://*.jivosite.com",
      "connect-src 'self' blob: https://api.resend.com https://api.coingecko.com wss://stream.binance.com:443 https://*.jivosite.com wss://*.jivosite.com https://*.tawk.to wss://*.tawk.to",
      "media-src 'self' blob: https://*.jivosite.com",
      "worker-src 'self' blob:",
      "frame-src 'self' blob: https://*.jivosite.com https://*.tawk.to",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
