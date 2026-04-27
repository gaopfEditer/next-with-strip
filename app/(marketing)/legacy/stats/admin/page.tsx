"use client"

import { useEffect, useState } from "react"

type Overview = {
  totalVisits?: number
  uniqueVisitors?: number
  totalArticleViews?: number
}

export default function LegacyStatsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [overview, setOverview] = useState<Overview>({})

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/stats/overview")
        if (!res.ok) {
          throw new Error("统计接口暂不可用")
        }
        const json = await res.json()
        setOverview(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="container py-10">
      <h1 className="mb-2 text-3xl font-bold">Legacy Stats Admin</h1>
      <p className="mb-6 text-muted-foreground">原统计管理页迁移版入口。</p>

      {loading ? <p>加载中...</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">总访问量</p>
            <p className="text-2xl font-semibold">{overview.totalVisits ?? 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">独立访客</p>
            <p className="text-2xl font-semibold">{overview.uniqueVisitors ?? 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">文章阅读量</p>
            <p className="text-2xl font-semibold">{overview.totalArticleViews ?? 0}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
