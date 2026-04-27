import { NextResponse } from "next/server"

import { pushLegacyMessageToCenter } from "@/lib/legacy/message-center"
import {
  formatLegacySignalMessage,
  sendLegacyTelegramMessage,
} from "@/lib/legacy/telegram"

export const runtime = "nodejs"

type TradingPayload = {
  ticker?: string
  type?: string
  time?: string
  close?: number
  high?: number
  low?: number
  message?: string
}

function normalizeBody(input: unknown): TradingPayload {
  if (typeof input === "string") {
    const raw = input.trim()
    const [left, right] = raw.split(";").map((v) => v?.trim())
    const fields = (left || "").split("|").map((v) => v.trim())
    return {
      ticker: fields[0],
      type: fields[1] || "trading_signal",
      time: fields[2],
      close: fields[3] ? Number(fields[3]) : undefined,
      high: fields[4] ? Number(fields[4]) : undefined,
      low: fields[5] ? Number(fields[5]) : undefined,
      message: right || raw,
    }
  }
  if (input && typeof input === "object") {
    return input as TradingPayload
  }
  return {}
}

export async function POST(req: Request) {
  try {
    const body = normalizeBody(await req.json().catch(() => null))
    if (!body.ticker) {
      return NextResponse.json(
        { success: false, message: "ticker 不能为空" },
        { status: 400 }
      )
    }

    const createdAt = new Date().toISOString()
    const signalType = body.type || "trading_signal"
    const title = `${body.ticker} ${signalType}`
    const content =
      body.message ||
      `${body.ticker} | ${signalType} | ${body.time || ""} | ${body.close ?? ""} | ${body.high ?? ""} | ${body.low ?? ""}`

    let forwarded = 0
    try {
      const center = await pushLegacyMessageToCenter({
        source: "tradingview",
        source_id: `${body.ticker}_${Date.now()}`,
        type: "trading_signal",
        title,
        content,
        metadata: {
          ticker: body.ticker,
          type: signalType,
          time: body.time || null,
          close: body.close ?? null,
          high: body.high ?? null,
          low: body.low ?? null,
        },
        sender: "TradingView",
        sender_id: "tradingview_webhook",
        created_at: createdAt,
      })
      forwarded = Number(center?.delivered || 0)
    } catch (error) {
      console.error("[tradingview] push message center failed:", error)
    }

    const telegramText = formatLegacySignalMessage({
      title,
      content,
      source: "tradingview",
      createdAt,
    })
    const telegram = await Promise.race([
      sendLegacyTelegramMessage(telegramText),
      new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: "telegram timeout" }), 1500)
      ),
    ])

    return NextResponse.json({
      success: true,
      message: "TradingView消息已接收并转发",
      data: {
        ticker: body.ticker,
        type: signalType,
        time: body.time || null,
        close: body.close ?? null,
        high: body.high ?? null,
        low: body.low ?? null,
      },
      forwarded,
      telegram,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
  }
}
