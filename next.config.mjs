/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ── Images ── */
  images: {
    unoptimized: true,
  },

  /* ── Production Optimization ── */
  compress: true,
  poweredByHeader: false,

  /* ── Headers for Performance & Security ── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/avatars/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)\\.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  /* ── Allowed Dev Origins ── */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
