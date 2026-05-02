type TelegramSendResult = {
  success: boolean
  messageId?: number
  error?: string
}

function getTelegramConfig() {
  const token =
    process.env.LEGACY_TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TEST_TELEGRAM_TOKEN
  const chatId =
    process.env.LEGACY_TELEGRAM_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TEST_GROUP_ID

  return { token, chatId }
}

export function formatLegacySignalMessage(input: {
  title: string
  content: string
  source: string
  createdAt: string
}) {
  return [
    `*${input.title}*`,
    "",
    input.content,
    "",
    `来源: ${input.source}`,
    `时间: ${input.createdAt}`,
  ].join("\n")
}

export async function sendLegacyTelegramMessage(text: string): Promise<TelegramSendResult> {
  const { token, chatId } = getTelegramConfig()
  if (!token || !chatId) {
    return { success: false, error: "Telegram token/chat id 未配置" }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  })

  const data = (await resp.json().catch(() => null)) as any
  if (!resp.ok || !data?.ok) {
    return {
      success: false,
      error: data?.description || `Telegram API error (${resp.status})`,
    }
  }

  return {
    success: true,
    messageId: data?.result?.message_id,
  }
}
