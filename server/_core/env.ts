export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // 多供應商 LLM 路由（按優先序）：
  //   Groq（國際主用，免費、不需綁卡）→ Cerebras（國際備援）→ DeepSeek（國內備援，
  //   中文最強、低價）→ Forge（舊版 Manus 沙箱，保留相容）。
  // 任一供應商 key 缺位時自動跳過；全部缺位時 invokeLLM 拋出明確錯誤而非靜默成功。
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  cerebrasApiKey: process.env.CEREBRAS_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};