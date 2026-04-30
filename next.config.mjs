import { withContentlayer } from "next-contentlayer"

import "./env.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_ESLINT === "1",
  },
  /** Docker 构建常见：CI 环境与本地 TS 校验差异；仅当 SKIP_TYPECHECK=1 时跳过 */
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "1",
  },
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
      level: process.env.VERBOSE_WEBPACK === "1" ? "verbose" : "error",
    }
    return config
  },
}

export default withContentlayer(nextConfig)
