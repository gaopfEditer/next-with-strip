import { redirect } from "next/navigation"

import { AUTH_SIGN_IN_PATH } from "@/lib/auth-constants"
import { freePlan } from "@/config/subscriptions"
import { isPrismaConnectionError } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { stripe } from "@/lib/stripe"
import { getUserSubscriptionPlan } from "@/lib/subscription"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BillingForm } from "@/components/billing-form"
import { DashboardHeader } from "@/components/header"
import { Icons } from "@/components/icons"
import { DashboardShell } from "@/components/shell"

export const metadata = {
  title: "Billing",
  description: "Manage billing and your subscription plan.",
}

export default async function BillingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(AUTH_SIGN_IN_PATH)
  }

  let subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
  let dbUnreachable = false

  try {
    subscriptionPlan = await getUserSubscriptionPlan(user.id)
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      dbUnreachable = true
      subscriptionPlan = {
        ...freePlan,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: 0,
        isPro: false,
      }
    } else {
      throw e
    }
  }

  // If user has a pro plan, check cancel status on Stripe.
  let isCanceled = false
  if (
    !dbUnreachable &&
    subscriptionPlan.isPro &&
    subscriptionPlan.stripeSubscriptionId
  ) {
    const stripePlan = await stripe.subscriptions.retrieve(
      subscriptionPlan.stripeSubscriptionId
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Billing"
        text="Manage billing and your subscription plan."
      />
      <div className="grid gap-8">
        {dbUnreachable ? (
          <Alert variant="destructive">
            <AlertTitle>无法连接数据库</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Prisma 只读取环境变量 <code className="rounded bg-muted px-1">DATABASE_URL</code>
                （与 <code className="rounded bg-muted px-1">DB_HOST</code> 等分开配置）。请确认库已启动且连接串正确；修改{" "}
                <code className="rounded bg-muted px-1">.env</code> 后需重启{" "}
                <code className="rounded bg-muted px-1">pnpm dev</code>。
              </p>
              <p className="text-xs text-muted-foreground">
                MySQL 连接串不要使用 PostgreSQL 的{" "}
                <code className="rounded bg-muted px-1">?schema=public</code>。
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="!pl-14">
              <Icons.warning />
              <AlertTitle>This is a demo app.</AlertTitle>
              <AlertDescription>
                Taxonomy app is a demo app using a Stripe test environment. You
                can find a list of test card numbers on the{" "}
                <a
                  href="https://stripe.com/docs/testing#cards"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-8"
                >
                  Stripe docs
                </a>
                .
              </AlertDescription>
            </Alert>
            <BillingForm
              subscriptionPlan={{
                ...subscriptionPlan,
                isCanceled,
              }}
            />
          </>
        )}
      </div>
    </DashboardShell>
  )
}
