"use client"

import { useEffect, useRef, useState } from "react"

import styles from "./ChatBox.module.css"

type SignalMessage = {
  id: number
  source: string
  type: string
  title?: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

type CenterEvent = {
  type: string
  message?: SignalMessage
  timestamp?: string
}

export default function LegacyWebsocketPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("未连接")
  const [messages, setMessages] = useState<SignalMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const autoScrollRef = useRef(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  useEffect(() => {
    if (autoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//127.0.0.1:3126/api/ws`
      setConnectionStatus("正在连接...")

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionStatus("已连接")
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as CenterEvent

          if (data.type === "heartbeat") {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "pong",
                  timestamp: new Date().toISOString(),
                })
              )
            }
            return
          }

          if (data.type === "message_received" && data.message) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === data.message!.id)
              if (exists) return prev
              return [...prev, data.message!].slice(-500)
            })
          }
        } catch {
          // ignore non-json payload
        }
      }

      ws.onerror = () => {
        setConnectionStatus("连接错误")
      }

      ws.onclose = () => {
        setIsConnected(false)
        setConnectionStatus("已断开")

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          setConnectionStatus(
            `正在重连 (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          )
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay)
        } else {
          setConnectionStatus("连接失败（已停止重连）")
        }
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) wsRef.current.close(1000, "组件卸载")
    }
  }, [])

  return (
    <section className="container py-10">
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>消息中心</h2>
          <div className={styles.status}>
            <span
              className={`${styles.statusIndicator} ${
                isConnected ? styles.connected : styles.disconnected
              }`}
            >
              {isConnected ? "●" : "○"}
            </span>
            <span>{connectionStatus}</span>
            {messages.length > 0 && (
              <span className={styles.messageCount}>({messages.length})</span>
            )}
          </div>
        </div>

        <div
          className={styles.messagesContainer}
          onScroll={(e) => {
            const el = e.currentTarget
            autoScrollRef.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 50
          }}
        >
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>暂无消息</p>
              <p className={styles.emptyHint}>等待接收消息...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageItem} ${
                  msg.source === "tradingview" || msg.type === "trading_signal"
                    ? styles.tradingSignal
                    : ""
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageSource}>{msg.source}</span>
                  <span className={styles.messageTime}>
                    {new Date(msg.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>

                {msg.title && (
                  <div className={styles.messageTitle}>{msg.title}</div>
                )}

                <div className={styles.messageContent}>{msg.content}</div>

                {msg.metadata && (
                  <details className={styles.messageMetadata}>
                    <summary>详细信息</summary>
                    <pre>{JSON.stringify(msg.metadata, null, 2)}</pre>
                  </details>
                )}

                <div className={styles.messageFooter}>
                  <span>ID: {msg.id}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.chatFooter}>
          <button
            className={styles.scrollToBottomBtn}
            onClick={() => {
              autoScrollRef.current = true
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }}
            disabled={messages.length === 0}
          >
            滚动到底部
          </button>

          {messages.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={() => setMessages([])}
            >
              清空消息
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
