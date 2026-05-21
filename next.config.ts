import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'acdn-us.mitiendanube.com',
      },
      {
        protocol: 'https',
        hostname: '*.mitiendanube.com',
      },
      {
        protocol: 'https',
        hostname: 'ahbniyqwhhjkfqouzkzy.supabase.co',
      },
    ],
  },
};

export default nextConfig;
