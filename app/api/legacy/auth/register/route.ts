import { z } from "zod"
import { NextResponse } from "next/server"

import { createLegacyUser, findLegacyUserByEmail } from "@/lib/legacy/db"
import {
  getLegacyTokenCookieName,
  legacyAuthCookieOptions,
  signLegacyToken,
} from "@/lib/legacy/auth"

export const runtime = "nodejs"

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码长度至少为 6 位"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = registerSchema.parse(body)

    const existing = await findLegacyUserByEmail(payload.email)
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "用户已存在",
        },
        { status: 409 }
      )
    }

    const user = await createLegacyUser(payload.email, payload.password)

    const token = signLegacyToken({
      userId: String(user.id),
      email: user.email,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: "注册成功",
        user: {
          id: user.id,
          email: user.email,
          is_enabled: user.is_enabled,
          created_at: user.created_at.toISOString(),
        },
        token,
      },
      { status: 201 }
    )

    response.cookies.set(
      getLegacyTokenCookieName(),
      token,
      legacyAuthCookieOptions()
    )

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message ?? "参数错误",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "服务器错误",
      },
      { status: 500 }
    )
  }
}
