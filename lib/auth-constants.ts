/** 与 lib/auth 中 pages.signIn 保持一致；供 RSC 使用，避免拉取整份 authOptions（含 Prisma/Postmark 等不可克隆引用）。 */
export const AUTH_SIGN_IN_PATH = "/login" as const
