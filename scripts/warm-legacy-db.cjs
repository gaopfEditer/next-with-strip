/**
 * 由 instrumentation 在 Node 进程启动时动态加载（webpackIgnore），
 * 避免 Edge 侧打包 instrumentation 时解析 mysql2。
 * 与 lib/legacy/db-connection.ts 使用相同环境变量。
 */
const mysql = require("mysql2/promise")

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nextjs_jwt",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
}

async function warm() {
  console.log("[legacy-db] 正在创建数据库连接池... (startup warm)")
  console.log("[legacy-db] 配置:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
    passwordSet: Boolean(dbConfig.password),
    passwordLength:
      typeof dbConfig.password === "string" ? dbConfig.password.length : 0,
  })

  const pool = mysql.createPool(dbConfig)
  try {
    const connection = await pool.getConnection()
    console.log("[legacy-db] 数据库连接成功")
    connection.release()
  } catch (error) {
    console.error("[legacy-db] 数据库连接失败:", error?.message || error)
    console.error("[legacy-db] 错误详情:", {
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
    })
  } finally {
    await pool.end().catch(() => {})
  }
}

void warm()
