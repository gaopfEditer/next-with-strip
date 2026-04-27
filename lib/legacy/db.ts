import "server-only"

import { getLegacyPool } from "@/lib/legacy/db-connection"
import { comparePassword, hashPassword } from "@/lib/legacy/auth"

// 模块加载即初始化连接池，这样首次触达 legacy API 时就会触发连接日志。
const pool = getLegacyPool()

export type LegacyUser = {
  id: number
  email: string
  password: string
  is_enabled: boolean
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

function mapRowToUser(row: any): LegacyUser {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    is_enabled: Boolean(row.is_enabled),
    last_login_at: row.last_login_at ? new Date(row.last_login_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

export async function findLegacyUserByEmail(email: string): Promise<LegacyUser | null> {
  const [rows] = (await pool.execute("SELECT * FROM users WHERE email = ?", [email])) as any[]
  if (!rows.length) return null
  return mapRowToUser(rows[0])
}

export async function findLegacyUserById(id: number): Promise<LegacyUser | null> {
  const [rows] = (await pool.execute("SELECT * FROM users WHERE id = ?", [id])) as any[]
  if (!rows.length) return null
  return mapRowToUser(rows[0])
}

export async function createLegacyUser(email: string, password: string): Promise<LegacyUser> {
  const existing = await findLegacyUserByEmail(email)
  if (existing) {
    throw new Error("用户已存在")
  }

  const hashedPassword = await hashPassword(password)
  const [result] = (await pool.execute(
    "INSERT INTO users (email, password, is_enabled) VALUES (?, ?, ?)",
    [email, hashedPassword, true]
  )) as any[]

  const user = await findLegacyUserById(result.insertId)
  if (!user) {
    throw new Error("创建用户失败")
  }

  return user
}

export async function verifyLegacyUserPassword(user: LegacyUser, password: string) {
  return comparePassword(password, user.password)
}

export async function updateLegacyLastLoginAt(userId: number) {
  await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [userId])
}
