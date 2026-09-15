// 伴小星「雙腦」後端：
// 1) 每分鐘滑動視窗限額（記憶體即可，Render 單實例免費層足夠；重啟自動清空）。
// 2) 使用者自備的 OpenAI 相容「代理」端點呼叫（base/key/model 由客戶端設定頁提供）。
// 3) 蘇格拉底反思訊息組裝（規則腦在客戶端離線運作，這裡只組 LLM 訊息）。
import type { Message } from "./_core/llm";

// ─────────────────────────────────────────────────────────────────────────────
// 每分鐘限額
// ─────────────────────────────────────────────────────────────────────────────

export type RateLimitDecision = {
  allowed: boolean;
  /** 通過後，本視窗內還剩幾次。 */
  remaining: number;
  /** 被擋下時，最快多久後可再試（毫秒）。 */
  retryAfterMs: number;
};

/**
 * 單進程滑動視窗限流器：保留每個 key 最近 windowMs 內的命中時間戳。
 * 刻意不做跨實例共享——免費層單實例、且這是學習輔助呼叫，重啟清空可接受。
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly windowMs: number = 60_000) {}

  consume(key: string, limit: number, now: number = Date.now()): RateLimitDecision {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (recent.length >= limit) {
      const oldest = recent[0]!;
      const retryAfterMs = Math.max(0, oldest + this.windowMs - now);
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
  }

  /** 測試輔助：清空所有計數。 */
  reset(): void {
    this.hits.clear();
  }
}

/** 深度伴讀（reflect）：每個學生每分鐘最多幾次 LLM 提問。 */
export const REFLECT_LIMIT_PER_MIN = 8;
/** 代理連線測試（testProxy）：單一來源每分鐘最多幾次，避免被拿來打第三方。 */
export const PROXY_TEST_LIMIT_PER_MIN = 5;

export const reflectLimiter = new SlidingWindowRateLimiter(60_000);
export const proxyTestLimiter = new SlidingWindowRateLimiter(60_000);

// ─────────────────────────────────────────────────────────────────────────────
// 使用者自備 OpenAI 相容代理
// ─────────────────────────────────────────────────────────────────────────────

export type UserProxyConfig = {
  base: string;
  key: string;
  model?: string | null;
};

export type ProxyFailureKind =
  | "badurl"
  | "network"
  | "auth"
  | "notfound"
  | "limited"
  | "http"
  | "shape";

export class ProxyCallError extends Error {
  constructor(
    public readonly kind: ProxyFailureKind,
    message: string,
  ) {
    super(message);
    this.name = "ProxyCallError";
  }
}

const PROXY_TIMEOUT_MS = 20_000;
const DEFAULT_PROXY_MODEL = "gpt-4o-mini";

/**
 * 把使用者填的 API Base 正規化到 /chat/completions。
 * 接受三種寫法：https://x.com/v1、https://x.com/v1/、https://x.com/v1/chat/completions
 */
export function normalizeChatCompletionsUrl(base: string): string {
  const trimmed = base.trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    throw new ProxyCallError("badurl", "API Base 必須是 http(s):// 開頭的完整網址");
  }
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
}

export type ProxyCallResult = {
  content: string;
  model: string;
  /** 供應商回傳的 token 用量；未回傳時為 null。 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
};

/**
 * 對使用者自備的 OpenAI 相容端點發一次 chat completion。
 * 所有錯誤都轉成帶 kind 的 ProxyCallError，呼叫端可據此給中文提示。
 */
export async function callOpenAICompatibleProxy(
  config: UserProxyConfig,
  messages: Message[],
  maxTokens: number,
): Promise<ProxyCallResult> {
  const url = normalizeChatCompletionsUrl(config.base);
  const model = config.model?.trim() || DEFAULT_PROXY_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.key.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProxyCallError("network", "代理逾時（超過 20 秒沒回應），請確認網址與網路");
    }
    throw new ProxyCallError(
      "network",
      `連不上代理：${error instanceof Error ? error.message : "網路錯誤"}`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    const detail = raw.slice(0, 180);
    if (response.status === 401 || response.status === 403) {
      throw new ProxyCallError("auth", `代理回應 ${response.status}：金鑰無效或沒有權限`);
    }
    if (response.status === 404) {
      throw new ProxyCallError("notfound", `代理回應 404：請檢查 API Base 路徑或模型名稱「${model}」`);
    }
    if (response.status === 429) {
      throw new ProxyCallError("limited", "代理端也被限流了（429），請稍後再試");
    }
    throw new ProxyCallError("http", `代理回應 ${response.status}：${detail || "未提供說明"}`);
  }

  const body = (await response.json().catch(() => null)) as {
    model?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown };
  } | null;
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new ProxyCallError("shape", "代理回覆格式不正確（缺少 choices[0].message.content）");
  }
  const usage = body?.usage;
  const usagePayload = usage && (typeof usage.prompt_tokens === "number" || typeof usage.completion_tokens === "number" || typeof usage.total_tokens === "number")
    ? {
        promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0,
        completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0,
        totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : 0,
      }
    : null;
  return {
    content: content.trim(),
    model: typeof body?.model === "string" ? body.model : model,
    usage: usagePayload,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 反思（蘇格拉底提問）訊息組裝
// ─────────────────────────────────────────────────────────────────────────────

export type ReflectionContext = {
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  subject: string;
  learningTopic?: string;
  grade: number;
  turn: "first" | "more";
};

/**
 * 系統提示詞原則（沿用互動原型設計）：
 * 不直接給答案、一次只問一個問題、繁中、國小學習夥伴語氣。
 */
export const REFLECT_SYSTEM_PROMPT = [
  "你是台灣國小學生的閱讀學習夥伴「伴小星」。",
  "規則：",
  "1) 絕對不直接說出答案，只透過開放式提問引導學生自己發現；",
  "2) 使用繁體中文、溫和口語，像陪在旁邊的同儕；",
  "3) 每次只問「一個」問題，整段回覆不超過 60 個字；",
  "4) 只根據提供的題目、選項與答案回應，不編造課綱或課外事實；",
  "5) 不索取也不提及任何個人資料。",
].join("");

export function buildReflectionMessages(ctx: ReflectionContext): Message[] {
  const optionLines = ctx.options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join("　");
  const taskLine =
    ctx.turn === "more"
      ? "學生已經被引導過一次，請換一個不同角度，再問一個更深入的開放式問題，仍然不能直接說答案。"
      : ctx.correct
        ? "學生這題答對了，請用一個問題，引導他用自己的話解釋「為什麼這個選項對」。"
        : "學生這題答錯了，請針對「他選的選項」和「正確選項」的差異，問一個能引導他自己發現關鍵線索的問題。";

  const userContent = [
    `【科目】${ctx.subject}${ctx.learningTopic ? `（${ctx.learningTopic}）` : ""}`,
    `【年級】${ctx.grade} 年級`,
    `【題目】${ctx.question}`,
    `【選項】${optionLines}`,
    `【學生選的答案】${ctx.selectedAnswer || "（未選）"}`,
    `【正確答案】${ctx.correctAnswer}`,
    `【學生是否答對】${ctx.correct ? "是" : "否"}`,
    taskLine,
  ].join("\n");

  return [
    { role: "system", content: REFLECT_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}
