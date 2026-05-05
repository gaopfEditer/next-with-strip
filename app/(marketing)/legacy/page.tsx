import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const legacyPages = [
  { title: "Legacy Landing", href: "/legacy/landing", status: "已迁移" },
  { title: "Legacy Home", href: "/legacy/home", status: "已迁移" },
  { title: "Legacy Dashboard", href: "/legacy/dashboard", status: "已迁移" },
  { title: "Legacy Login", href: "/legacy/login", status: "已迁移" },
  { title: "Legacy Register", href: "/legacy/register", status: "已迁移" },
  { title: "Legacy WebSocket", href: "/legacy/websocket", status: "已迁移" },
  { title: "Legacy Stats Admin", href: "/legacy/stats/admin", status: "已迁移" },
  { title: "Legacy Article Detail", href: "/legacy/article/1", status: "已迁移" },
]

const legacyApis = [
  { title: "Auth Register", href: "/api/legacy/auth/register", status: "已迁移" },
  { title: "Auth Login", href: "/api/legacy/auth/login", status: "已迁移" },
  { title: "Auth Me", href: "/api/legacy/auth/me", status: "已迁移" },
  { title: "Auth Logout", href: "/api/legacy/auth/logout", status: "已迁移" },
  { title: "Webhook Receive", href: "/api/legacy/webhook/receive", status: "已迁移" },
  { title: "Gemini Chat", href: "/api/legacy/gemini/chat", status: "已迁移" },
]

export const metadata = {
  title: "Legacy",
  description: "Legacy pages and API migration portal.",
}

export default function LegacyPage() {
  return (
    <section className="container py-10">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl md:text-4xl">Legacy 迁移入口</h1>
        <p className="text-muted-foreground">
          这里集中展示原有页面与 legacy API 的迁移状态，作为迁移期间的统一导航入口。
        </p>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">原有页面入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {legacyPages.map((item) => (
            <div key={item.href} className="rounded-md border p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mb-3 text-sm text-muted-foreground">{item.status}</p>
              <Link
                href={item.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                打开
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Legacy API 入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {legacyApis.map((item) => (
            <div key={item.href} className="rounded-md border p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mb-3 text-sm text-muted-foreground">{item.status}</p>
              <Link
                href={item.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                打开
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
