import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.planvita.com.br",
        pathname: "/api/v1/**",
      },
    ],
  },
};

export default nextConfig;
