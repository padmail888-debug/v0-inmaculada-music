/** @type {import('next').NextConfig} */
// Local / Capacitor: static export → `out/` for `npx cap sync`
// Vercel: VERCEL=1 is set during build → full Next.js with /api routes (required for mobile against production)
const nextConfig = {
  // Capacitor WebView (`https://localhost`) → API on another scheme/port is cross-origin.
  // `headers()` applies even when middleware is flaky with `output: 'export'` in dev.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Authorization, Content-Type, Accept, Cache-Control, Pragma",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ]
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: false, // Disabled to prevent build issues
    scrollRestoration: true,
  },
  staticPageGenerationTimeout: 120,
  outputFileTracing: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

// Capacitor APK/IPA: static export on `next build` → `out/` for `npx cap sync`
// Vercel: VERCEL=1 during build → full Next.js with /api routes
// Local `next dev`: no export (API routes + headers work; avoids export warnings)
if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
  nextConfig.output = "export"
}

export default nextConfig
