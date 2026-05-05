const { createServer } = require("node:http")
const { parse } = require("node:url")
const WebSocket = require("ws")

const host = process.env.LEGACY_CENTER_HOST || "127.0.0.1"
const port = Number(process.env.LEGACY_CENTER_PORT || 3126)

const clients = new Map()

function getTelegramConfig() {
  return {
    token:
      process.env.LEGACY_TELEGRAM_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.TEST_TELEGRAM_TOKEN,
    chatId:
      process.env.LEGACY_TELEGRAM_CHAT_ID ||
      process.env.TELEGRAM_CHAT_ID ||
      process.env.TEST_GROUP_ID,
  }
}

function now() {
  return new Date().toISOString()
}

function json(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(payload))
}

function broadcast(message) {
  const data = JSON.stringify(message)
  let delivered = 0
  for (const [ws, info] of clients.entries()) {
    if (ws.readyState !== WebSocket.OPEN) continue
    ws.send(data)
    delivered += 1
    info.lastActiveAt = Date.now()
  }
  return delivered
}

function normalizeIncomingMessage(payload) {
  const rawMessage = typeof payload?.message === "string" ? payload.message.trim() : ""
  const source = String(payload?.source || "tradingview")
  const type = String(payload?.type || "trading_signal")
  const title = String(payload?.title || `${source} signal`)
  const content = rawMessage || String(payload?.content || "")
  const createdAt = now()

  return {
    id: Number(payload?.id || Date.now()),
    source,
    source_id: payload?.source_id ?? null,
    type,
    title,
    content,
    metadata: payload?.metadata ?? {},
    sender: payload?.sender ?? source,
    sender_id: payload?.sender_id ?? null,
    created_at: payload?.created_at ?? createdAt,
  }
}

function normalizeTradingViewPayload(payload) {
  if (typeof payload === "string") {
    const raw = payload.trim()
    const [left, right] = raw.split(";").map((v) => (v || "").trim())
    const fields = left.split("|").map((v) => v.trim())
    return {
      ticker: fields[0] || "",
      type: fields[1] || "trading_signal",
      time: fields[2] || null,
      close: fields[3] ? Number(fields[3]) : null,
      high: fields[4] ? Number(fields[4]) : null,
      low: fields[5] ? Number(fields[5]) : null,
      period: fields[6] || null,
      description: right || raw,
    }
  }
  const obj = payload && typeof payload === "object" ? payload : {}
  return {
    ticker: obj.ticker || "",
    type: obj.type || "trading_signal",
    time: obj.time || null,
    close: obj.close ?? null,
    high: obj.high ?? null,
    low: obj.low ?? null,
    period: obj.period || null,
    description: obj.message || obj.description || "",
  }
}

function formatTelegramText(input) {
  const lines = [
    `*${input.title}*`,
    "",
    input.content,
    "",
    `来源: ${input.source}`,
    `时间: ${input.createdAt}`,
  ]
  return lines.join("\n")
}

async function sendTelegramMessage(text) {
  const { token, chatId } = getTelegramConfig()
  if (!token || !chatId) {
    return { success: false, error: "Telegram token/chat id 未配置" }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })
    const data = await resp.json().catch(() => null)
    if (!resp.ok || !data?.ok) {
      return {
        success: false,
        error: data?.description || `Telegram API error (${resp.status})`,
      }
    }
    return { success: true, messageId: data?.result?.message_id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Telegram 发送异常",
    }
  } finally {
    clearTimeout(timer)
  }
}

const server = createServer((req, res) => {
  const { pathname } = parse(req.url || "", true)

  if (pathname === "/health" && req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "legacy-message-center",
      clients: clients.size,
      time: now(),
    })
  }

  if (pathname === "/push-message" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })
    req.on("end", () => {
      try {
        const payload = body ? JSON.parse(body) : {}
        const message = normalizeIncomingMessage(payload)
        const delivered = broadcast({
          type: "message_received",
          message,
          timestamp: now(),
        })
        return json(res, 200, {
          success: true,
          delivered,
          messageId: message.id,
        })
      } catch (error) {
        return json(res, 400, {
          success: false,
          error: "Invalid JSON",
          message: error instanceof Error ? error.message : "bad request",
        })
      }
    })
    return
  }

  if (pathname === "/api/tradingview/receive" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })
    req.on("end", async () => {
      try {
        const payload = body ? JSON.parse(body) : {}
        const tv = normalizeTradingViewPayload(payload)

        if (!tv.ticker) {
          return json(res, 400, { success: false, message: "ticker 不能为空" })
        }

        const createdAt = now()
        const title = `${tv.ticker} ${tv.type}`
        const content =
          tv.description ||
          `${tv.ticker} | ${tv.type} | ${tv.time || ""} | ${tv.close ?? ""} | ${tv.high ?? ""} | ${tv.low ?? ""}`

        const message = normalizeIncomingMessage({
          source: "tradingview",
          source_id: `${tv.ticker}_${Date.now()}`,
          type: "trading_signal",
          title,
          content,
          metadata: {
            ticker: tv.ticker,
            type: tv.type,
            period: tv.period,
            time: tv.time,
            close: tv.close,
            high: tv.high,
            low: tv.low,
          },
          sender: "TradingView",
          sender_id: "tradingview_webhook",
          created_at: createdAt,
        })

        const delivered = broadcast({
          type: "message_received",
          message,
          timestamp: now(),
        })

        const telegramText = formatTelegramText({
          title,
          content,
          source: "tradingview",
          createdAt,
        })
        sendTelegramMessage(telegramText)
          .then((result) => {
            if (result.success) {
              console.log(
                `[legacy-center] Telegram发送成功 messageId=${result.messageId || "-"}`
              )
            } else {
              console.error(`[legacy-center] Telegram发送失败: ${result.error}`)
            }
          })
          .catch((err) => {
            console.error(
              `[legacy-center] Telegram发送异常: ${err instanceof Error ? err.message : String(err)}`
            )
          })

        return json(res, 200, {
          success: true,
          message: "TradingView消息已接收并转发",
          data: {
            ticker: tv.ticker,
            type: tv.type,
            time: tv.time,
            close: tv.close,
            high: tv.high,
            low: tv.low,
          },
          forwarded: delivered,
          telegram: {
            success: true,
            queued: true,
          },
        })
      } catch (error) {
        return json(res, 500, {
          success: false,
          message: error instanceof Error ? error.message : "服务器内部错误",
        })
      }
    })
    return
  }

  return json(res, 404, { success: false, message: "Not Found" })
})

const wss = new WebSocket.Server({ noServer: true })

server.on("upgrade", (request, socket, head) => {
  const { pathname } = parse(request.url || "", true)
  if (pathname !== "/api/ws") {
    socket.destroy()
    return
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request)
  })
})

wss.on("connection", (ws) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  clients.set(ws, { id: clientId, lastActiveAt: Date.now() })

  ws.send(
    JSON.stringify({
      type: "welcome",
      clientId,
      message: "connected",
      timestamp: now(),
    })
  )

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString())
      if (data?.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: now() }))
      }
    } catch {}
  })

  ws.on("close", () => {
    clients.delete(ws)
  })

  ws.on("error", () => {
    clients.delete(ws)
  })
})

server.listen(port, host, () => {
  console.log(`[legacy-center] http://${host}:${port}`)
  console.log(`[legacy-center] ws://${host}:${port}/api/ws`)
})
