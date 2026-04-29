import { withContentlayer } from "next-contentlayer"

import "./env.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  experimental: {
    appDir: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@prisma/client", "mysql2"],
    /** Docker standalone：把 Contentlayer 产物、字体与 Prisma/mysql2 打进 trace */
    outputFileTracingIncludes: {
      "/*": [
        "./.contentlayer/generated/**/*",
        "./assets/fonts/**/*",
        "./node_modules/.prisma/**/*",
        "./node_modules/mysql2/**/*",
      ],
    },
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    }
    return config
  },
}

export default withContentlayer(nextConfig)
