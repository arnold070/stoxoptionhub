// Sentry is optional — build succeeds even if package isn't installed
let withSentryConfig
try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig
} catch {
  withSentryConfig = (config) => config // passthrough if Sentry not installed
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone' enables optimised self-hosted deployment
  // This is correct for VPS deployment with PM2
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'ecove.com.ng', 'www.ecove.com.ng'],
    },
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.flutterwave.com https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com",
      "connect-src 'self' https://api.paystack.co https://api.flutterwave.com https://o*.ingest.sentry.io",
      "frame-src https://checkout.paystack.com https://checkout.flutterwave.com",
      "font-src 'self' https://fonts.gstatic.com",
      "worker-src blob:",
    ].join('; ')

    return [
      {
        // Security headers on every response
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',   value: csp },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Extra restriction on API routes
        source: '/api/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/vendor/dashboard', permanent: false },
      { source: '/seller',    destination: '/vendor/register',  permanent: false },
      { source: '/apply',     destination: '/vendor/register',  permanent: false },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  // @sentry/nextjs v8 compatible options
  org:                        process.env.SENTRY_ORG     || '',
  project:                    process.env.SENTRY_PROJECT || 'ecove-marketplace',
  silent:                     !process.env.CI,
  widenClientFileUpload:      true,
  hideSourceMaps:             true,
  disableLogger:              true,
  automaticVercelMonitors:    false,
  // reactComponentAnnotation: adds component names to errors
  reactComponentAnnotation:   { enabled: true },
  // NOTE: 'transpileClientSDK' was removed in v8 — do not add it
})
