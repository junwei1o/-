import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 多供應商 LLM 路由
// ─────────────────────────────────────────────────────────────────────────────
//
// 為什麼這樣寫：
  //   1. 用戶現實裡只有 GROQ_API_KEY（你提供的 `gsk_...`），沒有 Forge key 也沒有
  //      Cerebras key。原 `invokeLLM` 會直接 throw "BUILT_IN_FORGE_API_KEY is not configured"。
  //   2. 路由策略：Groq 主用（中文強、Llama 3.3 70B 結構化輸出）→ Cerebras 備援（不需
  //      綁卡、速度極快）→ Forge 兜底（保留舊行為，不讓部署靜默壞掉）。
//   3. 任一 provider 暫時不可用（401/403/429/5xx/網路錯誤/超時）自動切下一家。
//      4xx 的 schema 校驗錯誤屬於「所有 provider 都會錯」，不切。
//   4. 模型覆寫規則：呼叫方傳入 `model` 時只嘗試主供應商；切到備援時改用備援的預設
//      模型（避免把不存在的模型名丟給下一家）。

type ProviderId = "groq" | "cerebras" | "deepseek" | "forge";

type ProviderConfig = {
  id: ProviderId;
  url: string;
  apiKey: string;
  /** 預設模型；undefined 表示由該供應商自行決定（Forge 的行為）。 */
  defaultModel?: string;
};

const FORGE_BASE = "https://forge.manus.im";

const resolveForgeBaseUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}`
    : FORGE_BASE;

const buildProviderChain = (): ProviderConfig[] => {
  const chain: ProviderConfig[] = [];
  if (ENV.groqApiKey) {
    // Groq 免費層目前可用模型清單（2026 Q1 實測）：openai/gpt-oss-120b、
    // openai/gpt-oss-20b、qwen/qwen3.6-27b、groq/compound 等；舊的
    // llama-3.3-70b-versatile 已下架。選 gpt-oss-120b 作為主用：能力最強、
    // 結構化輸出穩定、120B 規模對國小中文任務足夠。
    chain.push({
      id: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: ENV.groqApiKey,
      defaultModel: "openai/gpt-oss-120b",
    });
  }
  if (ENV.cerebrasApiKey) {
    chain.push({
      id: "cerebras",
      url: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: ENV.cerebrasApiKey,
      defaultModel: "llama-3.3-70b",
    });
  }
  if (ENV.deepseekApiKey) {
    // DeepSeek：國內註冊即送額度、中文最優、低價；OpenAI 相容協議，
    // 支援 json_schema 結構化輸出。url 用官方推薦的 chat 端點。
    chain.push({
      id: "deepseek",
      url: "https://api.deepseek.com/v1/chat/completions",
      apiKey: ENV.deepseekApiKey,
      defaultModel: "deepseek-chat",
    });
  }
  if (ENV.forgeApiKey) {
    chain.push({
      id: "forge",
      url: `${resolveForgeBaseUrl()}/v1/chat/completions`,
      apiKey: ENV.forgeApiKey,
    });
  }
  return chain;
};

const assertAnyProvider = () => {
  if (buildProviderChain().length === 0) {
    throw new Error(
      "No LLM provider configured. Set one of GROQ_API_KEY, CEREBRAS_API_KEY, or BUILT_IN_FORGE_API_KEY."
    );
  }
};

// 單次 provider 呼叫的逾時。Groq/Cerebras 一般 1–3 秒回，30 秒涵蓋最差情況。
const PROVIDER_TIMEOUT_MS = 30_000;

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
// 回傳結構改成 `Response | { fatal: true; error: Error }`，讓呼叫端在遇到無法
// 重試的錯誤（4xx schema 校驗、逾時）時直接跳到下一家 provider。
const fetchWithBackoff = async (
  url: string,
  init: FetchInit,
  signal?: AbortSignal
): Promise<Response | { fatal: true; error: Error }> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(
      () => controller.abort(new Error("LLM request timed out")),
      PROVIDER_TIMEOUT_MS,
    );
    // 允許外部 signal 同時取消
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutHandle);
        return {
          fatal: true,
          error: new Error("LLM request aborted by caller"),
        };
      }
      signal.addEventListener("abort", () => controller.abort(signal.reason));
    }

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutHandle);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }

      // 4xx（除 408/429）多半是呼叫方錯誤（schema 校驗、未授權），不值得對同一家
      // 重試，也代表下一家也會錯。直接 fatal 讓 router 跳下一家或最終拋錯。
      const status = response.status;
      const isRetryableHttp = status === 408 || status === 429 || status >= 500;
      if (!isRetryableHttp) {
        const errorText = await response.text();
        return {
          fatal: true,
          error: new Error(
            `LLM invoke non-retryable ${status}: ${errorText.slice(0, 500)}`
          ),
        };
      }

      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      clearTimeout(timeoutHandle);
      lastError = error;
      // AbortError = 逾時，下一家。
      if (error instanceof Error && error.name === "AbortError") {
        return {
          fatal: true,
          error: new Error("LLM request timed out"),
        };
      }
      if (attempt === RETRY_MAX_RETRIES) {
        return {
          fatal: true,
          error:
            error instanceof Error ? error : new Error("LLM request failed"),
        };
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }

  return {
    fatal: true,
    error:
      lastError instanceof Error
        ? lastError
        : new Error("LLM request failed after exhausting retries"),
  };
};

const buildProviderPayload = (
  base: Record<string, unknown>,
  provider: ProviderConfig,
  callerModel: string | undefined,
): Record<string, unknown> => {
  const payload = { ...base };
  // 只在主供應商上套用呼叫方指定的模型；備援一律用自己的預設，避免把不存在的
  // 模型名（如「gemini-...」）丟給 Llama 拿到 404。
  const resolvedModel =
    provider.defaultModel ?? callerModel ?? undefined;
  if (resolvedModel) {
    payload.model = resolvedModel;
  } else {
    delete payload.model;
  }
  return payload;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertAnyProvider();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const basePayload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    basePayload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    basePayload.tool_choice = normalizedToolChoice;
  }

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    basePayload.max_tokens = resolvedMaxTokens;
  }

  if (thinking) {
    basePayload.thinking = thinking;
  }
  if (reasoning) {
    basePayload.reasoning = reasoning;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    basePayload.response_format = normalizedResponseFormat;
  }

  const providers = buildProviderChain();
  let lastError: Error | undefined;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]!;
    const isPrimary = i === 0;
    const payload = buildProviderPayload(basePayload, provider, model);

    const result = await fetchWithBackoff(
      provider.url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if ("fatal" in result) {
      lastError = result.error;
      console.warn(
        `[LLM router] ${provider.id} failed: ${result.error.message}${isPrimary && providers.length > 1 ? " — falling through" : ""}`,
      );
      continue;
    }

    if (!result.ok) {
      const errorText = await result.text();
      lastError = new Error(
        `LLM invoke failed on ${provider.id}: ${result.status} ${result.statusText} – ${errorText}`,
      );
      console.warn(
        `[LLM router] ${provider.id} returned ${result.status}${isPrimary && providers.length > 1 ? " — falling through" : ""}`,
      );
      continue;
    }

    const body = (await result.json()) as InvokeResult;
    console.log(
      `[LLM router] ${provider.id} succeeded (model=${body.model ?? "?"})`,
    );
    return body;
  }

  throw (
    lastError ??
    new Error("LLM invoke failed: no provider succeeded")
  );
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

// 模型列表保留 Forge 行為（其它 provider 不一定提供 /v1/models）。
// 只有 Forge 存在時才能用，否則丟出指引訊息。
export async function listLLMModels(): Promise<ModelsResponse> {
  if (!ENV.forgeApiKey) {
    throw new Error(
      "listLLMModels requires BUILT_IN_FORGE_API_KEY (其它 provider 請洽其官方文件查型號)",
    );
  }

  const url = `${resolveForgeBaseUrl()}/v1/models`;

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${ENV.forgeApiKey}` },
  });

  if ("fatal" in response) throw response.error;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as ModelsResponse;
}