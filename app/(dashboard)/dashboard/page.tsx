import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"

import { AUTH_SIGN_IN_PATH } from "@/lib/auth-constants"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  db,
  isPrismaConnectionError,
  isPrismaMissingTableError,
  tryOncePrismaDbPushInDev,
} from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { DashboardHeader } from "@/components/header"
import { PostCreateButton } from "@/components/post-create-button"
import { PostItem } from "@/components/post-item"
import { DashboardShell } from "@/components/shell"

export const metadata = {
  title: "Dashboard",
}

const postListSelect = {
  id: true,
  title: true,
  published: true,
  createdAt: true,
} as const

type DashboardPost = Prisma.PostGetPayload<{ select: typeof postListSelect }>

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(AUTH_SIGN_IN_PATH)
  }

  let posts: DashboardPost[]
  let dbUnreachable = false

  const loadPosts = () =>
    db.post.findMany({
      where: {
        authorId: user.id,
      },
      select: postListSelect,
      orderBy: {
        updatedAt: "desc",
      },
    })

  try {
    posts = await loadPosts()
  } catch (e) {
    if (isPrismaMissingTableError(e) && tryOncePrismaDbPushInDev()) {
      try {
        posts = await loadPosts()
      } catch (e2) {
        if (isPrismaConnectionError(e2)) {
          dbUnreachable = true
          posts = []
        } else {
          throw e2
        }
      }
    } else if (isPrismaConnectionError(e)) {
      dbUnreachable = true
      posts = []
    } else {
      throw e
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Posts" text="Create and manage posts.">
        <PostCreateButton disabled={dbUnreachable} />
      </DashboardHeader>
      <div>
        {dbUnreachable ? (
          <Alert variant="destructive">
            <AlertTitle>无法连接数据库</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                请确认 MySQL 已启动，且 <code className="rounded bg-muted px-1">DATABASE_URL</code>{" "}
                中的主机与端口正确（当前报错指向无法访问的地址）。
              </p>
              <p className="text-xs text-muted-foreground">
                启动数据库后刷新本页即可加载文章列表；新建文章同样需要可用的数据库。
              </p>
            </AlertDescription>
          </Alert>
        ) : posts?.length ? (
          <div className="divide-y divide-border rounded-md border">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon name="post" />
            <EmptyPlaceholder.Title>No posts created</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              You don&apos;t have any posts yet. Start creating content.
            </EmptyPlaceholder.Description>
            <PostCreateButton variant="outline" />
          </EmptyPlaceholder>
        )}
      </div>
    </DashboardShell>
  )
}
