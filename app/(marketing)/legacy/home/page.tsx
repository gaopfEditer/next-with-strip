import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Legacy Home",
}

export default function LegacyHomePage() {
  return (
    <section className="container py-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Legacy Home</h1>
        <p className="text-muted-foreground">
          原项目首页聚合了聊天、统计和会话能力。此处提供迁移后的入口导航。
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/legacy/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Legacy Dashboard
        </Link>
        <Link href="/legacy/websocket" className={cn(buttonVariants({ variant: "outline" }))}>
          Legacy WebSocket
        </Link>
        <Link href="/legacy/stats/admin" className={cn(buttonVariants({ variant: "outline" }))}>
          Legacy Stats Admin
        </Link>
        <Link href="/legacy/article/1" className={cn(buttonVariants({ variant: "outline" }))}>
          示例文章 1
        </Link>
        <Link href="/legacy/article/2" className={cn(buttonVariants({ variant: "outline" }))}>
          示例文章 2
        </Link>
      </div>
    </section>
  )
}
