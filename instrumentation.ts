/**
 * Node 进程启动时预热 legacy DB 连通性日志。
 * mysql2 不能出现在本文件的静态依赖里：Next 会为 Edge 与 Node 各打一份 instrumentation，
 * Edge 打包会失败。改为 webpackIgnore 动态加载 scripts/warm-legacy-db.cjs。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  const { pathToFileURL } = await import(/* webpackIgnore: true */ "node:url")
  const { join } = await import(/* webpackIgnore: true */ "node:path")
  const href = pathToFileURL(
    join(process.cwd(), "scripts", "warm-legacy-db.cjs")
  ).href

  await import(/* webpackIgnore: true */ href)
}
