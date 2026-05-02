import { withContentlayer } from "next-contentlayer"

import "./env.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  experimental: {
    appDir: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@prisma/client", "mysql2"],
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    }
    return config
  },
}

export default withContentlayer(nextConfig)
