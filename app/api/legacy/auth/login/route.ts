import { z } from "zod"
import { NextResponse } from "next/server"

import {
  findLegacyUserByEmail,
  updateLegacyLastLoginAt,
  verifyLegacyUserPassword,
} from "@/lib/legacy/db"
import {
  getLegacyTokenCookieName,
  legacyAuthCookieOptions,
  signLegacyToken,
} from "@/lib/legacy/auth"

export const runtime = "nodejs"

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请填写密码"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = loginSchema.parse(body)

    const user = await findLegacyUserByEmail(payload.email)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    if (!user.is_enabled) {
      return NextResponse.json(
        { success: false, message: "账户已被禁用" },
        { status: 403 }
      )
    }

    const isPasswordValid = await verifyLegacyUserPassword(user, payload.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    await updateLegacyLastLoginAt(user.id)
    const updated = await findLegacyUserByEmail(payload.email)
    if (!updated) {
      throw new Error("用户不存在")
    }

    const token = signLegacyToken({
      userId: String(updated.id),
      email: updated.email,
    })

    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      user: {
        id: updated.id,
        email: updated.email,
        is_enabled: updated.is_enabled,
        last_login_at: updated.last_login_at?.toISOString() ?? null,
      },
      token,
    })

    response.cookies.set(
      getLegacyTokenCookieName(),
      token,
      legacyAuthCookieOptions()
    )

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    )
  }
}
