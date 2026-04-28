import { NextResponse } from "next/server"

import { findLegacyUserById } from "@/lib/legacy/db"
import { getLegacyTokenFromRequest, verifyLegacyToken } from "@/lib/legacy/auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const token = getLegacyTokenFromRequest(req)
  if (!token) {
    return NextResponse.json(
      { success: false, message: "未授权" },
      { status: 401 }
    )
  }

  const payload = verifyLegacyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "未授权" },
      { status: 401 }
    )
  }

  const numericId = Number(payload.userId)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json(
      { success: false, message: "未授权" },
      { status: 401 }
    )
  }

  const user = await findLegacyUserById(numericId)
  if (!user) {
    return NextResponse.json(
      { success: false, message: "用户不存在" },
      { status: 404 }
    )
  }

  if (!user.is_enabled) {
    return NextResponse.json(
      { success: false, message: "账户已被禁用" },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      is_enabled: user.is_enabled,
      last_login_at: user.last_login_at?.toISOString() ?? null,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    },
  })
}
