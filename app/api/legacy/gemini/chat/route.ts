import { NextResponse } from "next/server"

import { env } from "@/env.mjs"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json(
        { success: false, error: "消息不能为空" },
        { status: 400 }
      )
    }

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY 未配置" },
        { status: 503 }
      )
    }

    const model = "gemini-1.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
      }),
    })

    if (!response.ok) {
      const raw = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: "Gemini 请求失败",
          detail: raw.slice(0, 500),
        },
        { status: 502 }
      )
    }

    const json = await response.json()
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "未获得可用回复，请重试"

    return NextResponse.json({ success: true, text })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时发生错误",
      },
      { status: 500 }
    )
  }
}
