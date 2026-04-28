type LegacyMessagePayload = {
  id?: number
  source: string
  source_id?: string | null
  type: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  sender?: string
  sender_id?: string | null
  created_at?: string
}

function getMessageCenterBaseUrl() {
  const port = process.env.LEGACY_CENTER_PORT || "3126"
  const host = process.env.LEGACY_CENTER_HOST || "127.0.0.1"
  return process.env.LEGACY_CENTER_URL || `http://${host}:${port}`
}

export async function pushLegacyMessageToCenter(payload: LegacyMessagePayload) {
  const base = getMessageCenterBaseUrl()
  const url = `${base}/push-message`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await response.json().catch(() => null)) as any
  if (!response.ok) {
    throw new Error(json?.message || `push message failed (${response.status})`)
  }
  return json
}
