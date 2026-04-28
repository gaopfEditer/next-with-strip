"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type LegacyUser = {
  id: string | null
  email: string | null
  name: string | null
}

export default function LegacyDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<LegacyUser | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/session")
        const json = await res.json()
        if (!res.ok || !json?.user) {
          throw new Error("unauthorized")
        }
        setUser({
          id: json.user.id ?? null,
          email: json.user.email ?? null,
          name: json.user.name ?? null,
        })
      } catch {
        router.push("/login?from=%2Flegacy%2Fdashboard")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function logout() {
    window.location.href = "/api/auth/signout?callbackUrl=/login"
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
        <p><strong>用户 ID:</strong> {user.id ?? "-"}</p>
        <p><strong>姓名:</strong> {user.name ?? "-"}</p>
        <p><strong>邮箱:</strong> {user.email ?? "-"}</p>
        <p><strong>登录体系:</strong> NextAuth 主站 Token</p>
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
