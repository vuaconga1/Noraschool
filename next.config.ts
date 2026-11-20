import type { NextConfig } from "next";

/** Parent portals allowed to embed Nora games via iframe */
const FRAME_ANCESTORS = [
  "'self'",
  "https://nora.com.vn",
  "https://*.nora.com.vn",
  "https://wewin.edu.vn",
  "https://*.wewin.edu.vn",
  "https://wewin.baobai.edu.vn",
  "https://script.google.com",
  "https://*.googleusercontent.com",
  "http://localhost:*",
  "http://127.0.0.1:*",
].join(" ");

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  async redirects() {
    return [
      {
        source: "/games/starters",
        destination: "/games/starters/hello-unit",
        permanent: false,
      },
      {
        source: "/games/movers",
        destination: "/games/movers/unit-1-at-the-park",
        permanent: false,
      },
      {
        source: "/games/flyers",
        destination: "/games/flyers/unit-0-hello",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nora.com.vn",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "wewin.edu.vn",
        pathname: "/wp-content/uploads/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/assets/levels/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${FRAME_ANCESTORS}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
