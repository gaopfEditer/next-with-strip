import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Legacy Landing",
}

export default function LegacyLandingPage() {
  return (
    <section className="container py-16">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Launch Legacy Landing</h1>
        <p className="text-lg text-muted-foreground">
          从想法到上线，更简单。该页面为原项目 landing 的迁移版入口。
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/legacy/register" className={cn(buttonVariants({ size: "lg" }))}>
            免费开始
          </Link>
          <Link
            href="/legacy/home"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            访问 Legacy Home
          </Link>
        </div>
      </div>
    </section>
  )
}
