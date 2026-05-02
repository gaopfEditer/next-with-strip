type PageProps = {
  params: {
    id: string
  }
}

const legacyArticles: Record<string, { title: string; content: string[] }> = {
  "1": {
    title: "如何实现访问统计功能",
    content: [
      "本文介绍了如何在 Next.js 应用中实现完整的访问统计功能。",
      "包括总访问量、独立访客数、文章阅读量等统计指标。",
      "核心思路是将访问事件标准化入库，再做聚合查询。",
    ],
  },
  "2": {
    title: "JWT 认证最佳实践",
    content: [
      "JWT 适合无状态认证场景，但必须重视密钥管理与过期策略。",
      "建议拆分 access token 与 refresh token，并限制 refresh 风险边界。",
    ],
  },
  "3": {
    title: "Next.js 性能优化技巧",
    content: [
      "可优先从路由分包、图片优化、缓存与渲染策略入手。",
      "在 App Router 中注意 Server Component 与 Client Component 的边界。",
    ],
  },
}

export default function LegacyArticlePage({ params }: PageProps) {
  const article = legacyArticles[params.id]
  if (!article) {
    return (
      <section className="container py-10">
        <h1 className="text-2xl font-semibold">文章不存在</h1>
        <p className="mt-2 text-muted-foreground">请检查文章 ID 是否正确。</p>
      </section>
    )
  }

  return (
    <section className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">{article.title}</h1>
      <div className="space-y-4">
        {article.content.map((p, idx) => (
          <p key={idx} className="leading-7 text-muted-foreground">
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
