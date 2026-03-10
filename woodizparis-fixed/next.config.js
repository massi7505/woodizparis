/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      // Clever Cloud Cellar CDN — remplace par ton vrai bucket
      {
        protocol: "https",
        hostname: process.env.B2_PUBLIC_URL
          ? new URL(process.env.B2_PUBLIC_URL).hostname
          : "*.cellar-c2.services.clever-cloud.com",
      },
    ],
    // N'active SVG dangereux que si vraiment nécessaire
    // dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
