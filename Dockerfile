# syntax=docker/dockerfile:1
#
# 构建阶段会加载 env.mjs（next.config 引入），需提供占位环境变量；部署时用真实 .env 或 compose environment。
# 运行：`RUN_MIGRATIONS=1` 时入口会先执行 `prisma migrate deploy`（需全局 prisma，见下方安装）。

FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ---------- 依赖 ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# ---------- 构建 ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# createEnv 在 next build 时校验；占位值仅用于镜像构建，切勿用于生产逻辑
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=docker-build-placeholder-secret-min-32-chars
ARG GITHUB_CLIENT_ID=docker_build_placeholder
ARG GITHUB_CLIENT_SECRET=docker_build_placeholder
ARG GITHUB_ACCESS_TOKEN=docker_build_placeholder
ARG DATABASE_URL=mysql://root:docker@127.0.0.1:3306/docker_build?connection_limit=1
ARG SMTP_FROM=build@localhost
ARG POSTMARK_API_TOKEN=docker_build_placeholder
ARG POSTMARK_SIGN_IN_TEMPLATE=docker_build_placeholder
ARG POSTMARK_ACTIVATION_TEMPLATE=docker_build_placeholder
ARG STRIPE_API_KEY=sk_test_docker_build_placeholder
ARG STRIPE_WEBHOOK_SECRET=whsec_docker_build_placeholder
ARG STRIPE_PRO_MONTHLY_PLAN_ID=price_docker_build_placeholder

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
    GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
    GITHUB_ACCESS_TOKEN=$GITHUB_ACCESS_TOKEN \
    DATABASE_URL=$DATABASE_URL \
    SMTP_FROM=$SMTP_FROM \
    POSTMARK_API_TOKEN=$POSTMARK_API_TOKEN \
    POSTMARK_SIGN_IN_TEMPLATE=$POSTMARK_SIGN_IN_TEMPLATE \
    POSTMARK_ACTIVATION_TEMPLATE=$POSTMARK_ACTIVATION_TEMPLATE \
    STRIPE_API_KEY=$STRIPE_API_KEY \
    STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET \
    STRIPE_PRO_MONTHLY_PLAN_ID=$STRIPE_PRO_MONTHLY_PLAN_ID

RUN pnpm build

# ---------- 运行（standalone） ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# migrate deploy 需要 CLI（体积小）
RUN npm install -g prisma@4.13.0

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
