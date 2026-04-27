"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type LegacyUser = {
  id: string
  email: string
  is_enabled: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export default function LegacyDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<LegacyUser | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/legacy/auth/me")
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error("unauthorized")
        }
        setUser(json.user)
      } catch {
        router.push("/legacy/login")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function logout() {
    await fetch("/api/legacy/auth/logout", { method: "POST" })
    router.push("/legacy/login")
    router.refresh()
  }

  if (loading) {
    return <section className="container py-10">加载中...</section>
  }

  if (!user) return null

  return (
    <section className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Legacy Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          登出
        </Button>
      </div>

      <div className="rounded-lg border p-6">
        <p><strong>用户 ID:</strong> {user.id}</p>
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>状态:</strong> {user.is_enabled ? "已启用" : "已禁用"}</p>
        <p><strong>最后登录:</strong> {user.last_login_at ?? "-"}</p>
        <p><strong>注册时间:</strong> {user.created_at}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/legacy/home" className="underline">
          返回 Legacy Home
        </Link>
        <Link href="/legacy/stats/admin" className="underline">
          前往 Stats Admin
        </Link>
      </div>
    </section>
  )
}
