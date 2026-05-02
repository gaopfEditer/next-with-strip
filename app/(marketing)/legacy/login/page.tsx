"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LegacyLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/legacy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const raw = await res.text()
      let json: { success?: boolean; message?: string }
      try {
        json = JSON.parse(raw) as typeof json
      } catch {
        throw new Error(
          "服务器未返回 JSON（多为接口编译失败）。请查看运行 next dev 的终端里是否有 mysql2/crypto 等报错。"
        )
      }
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "登录失败")
      }
      router.push("/legacy/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-lg border p-6">
        <h1 className="mb-6 text-2xl font-semibold">Legacy 登录</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          没有账号？ <Link href="/legacy/register" className="underline">去注册</Link>
        </p>
      </div>
    </section>
  )
}
