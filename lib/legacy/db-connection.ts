import "server-only"

import mysql from "mysql2/promise"

const dbConfig: mysql.PoolOptions = {
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

declare global {
  // eslint-disable-next-line no-var
  var legacyMysqlPool: mysql.Pool | undefined
}

function createPool() {
  console.log("[legacy-db] 正在创建数据库连接池...")
  console.log("[legacy-db] 配置:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
    passwordSet: Boolean(dbConfig.password),
    passwordLength: typeof dbConfig.password === "string" ? dbConfig.password.length : 0,
  })

  const pool = mysql.createPool(dbConfig)
  pool
    .getConnection()
    .then((connection) => {
      console.log("[legacy-db] 数据库连接成功")
      connection.release()
    })
    .catch((error: any) => {
      console.error("[legacy-db] 数据库连接失败:", error?.message || error)
      console.error("[legacy-db] 错误详情:", {
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
      })
    })

  return pool
}

export function getLegacyPool() {
  if (process.env.NODE_ENV !== "production") {
    if (!global.legacyMysqlPool) {
      global.legacyMysqlPool = createPool()
    }
    return global.legacyMysqlPool
  }

  if (!(globalThis as any).legacyMysqlPool) {
    ;(globalThis as any).legacyMysqlPool = createPool()
  }
  return (globalThis as any).legacyMysqlPool as mysql.Pool
}
