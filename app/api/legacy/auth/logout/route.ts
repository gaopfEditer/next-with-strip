import { NextResponse } from "next/server"

import { getLegacyTokenCookieName } from "@/lib/legacy/auth"

export const runtime = "nodejs"

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "登出成功",
  })

  response.cookies.set(getLegacyTokenCookieName(), "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
