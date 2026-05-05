import { getToken } from "next-auth/jwt"
import { cookies, headers } from "next/headers"

import { env } from "@/env.mjs"

/** 与 middleware 中 getToken 一致读 JWT，避免 getServerSession 走 jwt 回调时 DB 异常导致 session 为空而误判未登录。 */
export async function getCurrentUser() {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers().entries()),
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value])
      ),
    } as Parameters<typeof getToken>[0]["req"],
    secret: env.NEXTAUTH_SECRET,
  })

  if (!token) {
    return undefined
  }

  const id = token.id ?? token.sub
  if (!id || typeof id !== "string") {
    return undefined
  }

  return {
    id,
    name: token.name,
    email: token.email,
    image: token.picture ?? null,
  }
}
