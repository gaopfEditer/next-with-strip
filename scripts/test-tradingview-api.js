// Node.js 脚本：测试 TradingView API（taxonomy 版）
// 用法：
//   node scripts/test-tradingview-api.js
//   URL=http://localhost:3126/api/tradingview/receive node scripts/test-tradingview-api.js
//   TEST_FORMAT=old node scripts/test-tradingview-api.js

const https = require("https")
const http = require("http")
const { URL } = require("url")

// 新格式测试数据（推荐）
// 格式：{{ticker}} | {{type}} | {{time}} | {{close}} | {{high}} | {{low}} | {{period}} ; {{描述}}
const newFormatData = JSON.stringify(
  "MYXUSDT | RSI超买 | 2024-01-15T10:30:00Z | 45000.5 | 45100 | 44900 | 15m ; MYXUSDT RSI超买 | 时间:2024-01-15T10:30:00Z | 价格:45000.5 | 最高:45100 | 最低:44900"
)

// 旧格式测试数据（兼容）
const oldFormatData = JSON.stringify({
  ticker: "MYXUSDT",
  time: "2024-01-15T10:30:00Z",
  close: 45000.5,
  high: 45100,
  low: 44900,
  type: "RSI超买",
  message: "MYXUSDT 上插针 | 2024-01-15T10:30:00Z | 价格:45000.5 | 15M@45100+1H@45200",
})

const useNewFormat = process.env.TEST_FORMAT !== "old"
const data = useNewFormat ? newFormatData : oldFormatData

// 默认使用你当前项目 .env 的端口 3126
const targetUrl = process.env.URL || "http://localhost:3126/api/tradingview/receive"

console.log("🚀 TradingView API 测试工具（taxonomy）")
console.log("======================================")
console.log("数据格式:", useNewFormat ? "新格式（推荐）" : "旧格式（兼容）")
console.log("目标地址:", targetUrl)
console.log("")

let url
try {
  url = new URL(targetUrl)
} catch (error) {
  console.error("❌ URL 格式错误:", targetUrl)
  process.exit(1)
}

const isHttps = url.protocol === "https:"
const httpModule = isHttps ? https : http

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname || "/api/tradingview/receive",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data, "utf8"),
  },
  timeout: 10000,
}

console.log("📤 发送请求...")
console.log("   Path:", options.path)
console.log("   Payload:", data)
console.log("")

const req = httpModule.request(options, (res) => {
  let responseData = ""

  console.log("📥 收到响应")
  console.log("   状态码:", res.statusCode)
  console.log("   状态消息:", res.statusMessage)

  res.on("data", (chunk) => {
    responseData += chunk
  })

  res.on("end", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("✅ 请求成功")
      try {
        const parsed = JSON.parse(responseData)
        console.log("   响应数据:", JSON.stringify(parsed, null, 2))
      } catch {
        console.log("   响应数据（原始）:", responseData)
      }
      return
    }

    console.error("❌ 请求失败")
    try {
      const parsed = JSON.parse(responseData)
      console.error("   错误响应:", JSON.stringify(parsed, null, 2))
    } catch {
      console.error("   错误响应（原始）:", responseData)
    }
    process.exit(1)
  })
})

req.on("error", (error) => {
  console.error("❌ 请求失败:", error.message)
  console.error("   错误代码:", error.code)
  process.exit(1)
})

req.on("timeout", () => {
  console.error("❌ 请求超时（10秒）")
  req.destroy()
  process.exit(1)
})

req.setTimeout(10000, () => {
  req.destroy()
})

req.write(data)
req.end()
