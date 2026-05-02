/** 与 global-agent 一并通过 NODE_OPTIONS --require 预加载，拉长 GitHub OAuth 出站超时 */
const { custom } = require("openid-client")
custom.setHttpOptionsDefaults({ timeout: 20_000 })
