import { NextResponse } from "next/server"
import { pushLegacyMessageToCenter } from "@/lib/legacy/message-center"
import {
  formatLegacySignalMessage,
  sendLegacyTelegramMessage,
} from "@/lib/legacy/telegram"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Bad request", message: "请求体必须为 JSON 对象" },
        { status: 400 }
      )
    }

    const source = body.source
    if (source === undefined || source === null) {
      return NextResponse.json(
        { success: false, error: "Bad request", message: "缺少 source 字段" },
        { status: 400 }
      )
    }

    const sourceStr = String(source)
    const signature = body.signature ?? null
    const data = body.data ?? null
    const message = typeof body.message === "string" ? body.message.trim() : ""

    const content = message || (typeof data === "string" ? data : JSON.stringify(data ?? {}))
    const title = `${sourceStr} webhook 信号`
    const createdAt = new Date().toISOString()

    let forwarded = 0
    let telegram: { success: boolean; messageId?: number; error?: string } = {
      success: false,
      error: "未触发",
    }

    try {
      const result = await pushLegacyMessageToCenter({
        source: sourceStr,
        source_id: signature ? String(signature) : null,
        type: "trading_signal",
        title,
        content,
        metadata: typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {},
        sender: sourceStr,
        sender_id: signature ? String(signature) : null,
        created_at: createdAt,
      })
      forwarded = Number(result?.delivered || 0)
    } catch (error) {
      console.error("[legacy webhook] 推送消息中心失败:", error)
    }

    try {
      telegram = await sendLegacyTelegramMessage(
        formatLegacySignalMessage({
          title,
          content,
          source: sourceStr,
          createdAt,
        })
      )
    } catch (error) {
      telegram = {
        success: false,
        error: error instanceof Error ? error.message : "Telegram 发送异常",
      }
    }

    // P0阶段：先兼容接收协议，whisper 先记录并返回可追踪响应。
    if (sourceStr.toLowerCase() === "whisper") {
      return NextResponse.json({
        success: true,
        message: "已接收（whisper）",
        forwarded,
        telegram,
        received: {
          signature,
          source: sourceStr,
          data,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "已接收",
      forwarded,
      telegram,
      received: {
        signature,
        source: sourceStr,
        data,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
  }
}
