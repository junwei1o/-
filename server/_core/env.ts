const isProduction = process.env.NODE_ENV === "production";

// 安全止血（2026-09-28）：生產環境缺 JWT_SECRET 時，空字串仍可簽出合法 HS256
// 會話（sdk.ts getSessionSecret 直接 encode），等於會話零鑑權。開發環境放行
// 以免擋住本地啟動；生產直接 fail-fast，寧可起不來也不帶病上線。
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error(
    "[env] JWT_SECRET 未設定：生產環境拒絕以空字串簽署會話。請在 Render Dashboard 的 Environment 頁設定 JWT_SECRET 後重啟。"
  );
}

// 教師通關語（計劃 A Phase 1）：未設定時只影響「教師端寫入操作」——登入端點
// 回 notConfigured、teacherProcedure 全數拒絕（安全側降級），不應拖垮整站啟動。
// 因此與 JWT_SECRET 不同，這裡不 fail-fast，只在生產環境警告提醒補設。
if (isProduction && !process.env.TEACHER_PASSPHRASE) {
  console.warn(
    "[env] TEACHER_PASSPHRASE 未設定：教師端寫入／刪除操作將一律被拒。請於 Render Dashboard 設定後重啟。"
  );
}

// 站長通關語（2026-10-01）：站長後台（/admin）專用，與教師通關語**分開**——
// 兩者定位不同（老師管班級與教學；站長管全站營運與基礎設施），權限也不同，
// 共用一組密語會讓「老師」實質上取得站長權限。
// 未設定時站長後台一律進不去（安全側降級），不影響其他角色。
if (isProduction && !process.env.ADMIN_PASSPHRASE) {
  console.warn(
    "[env] ADMIN_PASSPHRASE 未設定：站長後台（/admin）將無法登入。請於 Render Dashboard 設定後重啟。"
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  /** 教師通關語（計劃 A）：空字串＝未配置，teacher.login 一律拒絕。 */
  teacherPassphrase: process.env.TEACHER_PASSPHRASE ?? "",
  /** 站長通關語（2026-10-01）：空字串＝未配置，admin.login 一律拒絕。 */
  adminPassphrase: process.env.ADMIN_PASSPHRASE ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // 多供應商 LLM 路由（按優先序）：
  //   Groq（國際主用，免費、不需綁卡）→ Cerebras（國際備援）→ Qwen（國內中文保險，
  //   阿里百煉新帳號送額度）→ DeepSeek（中文最強但需充值）→ Forge（舊版 Manus 沙箱，保留相容）。
  // 任一供應商 key 缺位時自動跳過；全部缺位時 invokeLLM 拋出明確錯誤而非靜默成功。
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  cerebrasApiKey: process.env.CEREBRAS_API_KEY ?? "",
  qwenApiKey: process.env.QWEN_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  // LINE Messaging API（LINE Notify 已於 2025/3 停用）：
  //   金鑰設了才啟用「做題完成 → 推 LINE 給老師」；未設則功能完全休眠、不影響其他服務。
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
};