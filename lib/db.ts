import { spawnSync } from "child_process"

import { PrismaClient } from "@prisma/client"
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library"

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient
}

let prisma: PrismaClient
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient()
  }
  prisma = global.cachedPrisma
}

export const db = prisma

/** 连接不上数据库（未启动、端口/URL 错误等） */
export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof PrismaClientInitializationError) {
    return true
  }
  if (error instanceof PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1017"
  }
  return false
}

/** 表 / 枚举等在当前库中不存在（常见于未跑过 migrate / db push） */
export function isPrismaMissingTableError(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError && error.code === "P2021"
  )
}

let devPrismaDbPushAttempted = false

/**
 * 仅在 development：对当前 DATABASE_URL 执行一次 `prisma db push`（按 schema 建表）。
 * 生产环境不执行；可用环境变量 `PRISMA_DISABLE_AUTO_PUSH=1` 关闭。
 */
export function tryOncePrismaDbPushInDev(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false
  }
  if (process.env.PRISMA_DISABLE_AUTO_PUSH === "1") {
    return false
  }
  if (devPrismaDbPushAttempted) {
    return false
  }
  devPrismaDbPushAttempted = true

  console.warn(
    "[prisma] 检测到库结构缺失，正在执行一次 prisma db push（仅开发环境）…"
  )

  const r = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: true,
  })

  return r.status === 0
}
