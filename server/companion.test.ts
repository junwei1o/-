import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.BUILT_IN_FORGE_API_KEY ??= "test-forge-key";
});

// reflect 成功後會寫 token 用量；測試環境無資料庫，只 mock 寫入函數。
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    addAiTokenUsage: vi.fn().mockResolvedValue({ calls: 1, promptTokens: 0, completionTokens: 0, totalTokens: 0 }),
    listAiTokenUsage: vi.fn().mockResolvedValue([]),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  REFLECT_LIMIT_PER_MIN,
  PROXY_TEST_LIMIT_PER_MIN,
  SlidingWindowRateLimiter,
  buildReflectionMessages,
  callOpenAICompatibleProxy,
  normalizeChatCompletionsUrl,
  ProxyCallError,
  proxyTestLimiter,
  reflectLimiter,
} from "./companion";

const context = {
  user: null,
  req: { ip: "10.20.30.40", protocol: "https", headers: {} } as unknown as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const reflectInput = {
  proxy: { base: "https://proxy.example.com/v1", key: "sk-test", model: "gpt-4o-mini" },
  question: "3 + 2 等於多少？",
  options: ["3", "5", "6", "8"],
  selectedAnswer: "6",
  correctAnswer: "5",
  correct: false,
  subject: "數學",
  learningTopic: "加法",
  grade: 3,
  turn: "first" as const,
};

afterEach(() => {
  vi.unstubAllGlobals();
  reflectLimiter.reset();
  proxyTestLimiter.reset();
});

describe("SlidingWindowRateLimiter 每分鐘限額", () => {
  it("額度內放行並回報剩餘次數", () => {
    const limiter = new SlidingWindowRateLimiter(60_000);
    expect(limiter.consume("s1", 3, 0)).toMatchObject({ allowed: true, remaining: 2 });
    expect(limiter.consume("s1", 3, 1_000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume("s1", 3, 2_000)).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("超額擋下，並給出最早命中滑出視窗所需等待時間", () => {
    const limiter = new SlidingWindowRateLimiter(60_000);
    limiter.consume("s1", 2, 0);
    limiter.consume("s1", 2, 10_000);
    const blocked = limiter.consume("s1", 2, 30_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // 最早一筆在 t=0，視窗 60s，現在 t=30s → 再 30s 滑出
    expect(blocked.retryAfterMs).toBe(30_000);
  });

  it("視窗滑過後自動恢復額度", () => {
    const limiter = new SlidingWindowRateLimiter(60_000);
    limiter.consume("s1", 1, 0);
    expect(limiter.consume("s1", 1, 30_000).allowed).toBe(false);
    expect(limiter.consume("s1", 1, 60_001).allowed).toBe(true);
  });

  it("不同 key 各自計算", () => {
    const limiter = new SlidingWindowRateLimiter(60_000);
    limiter.consume("a", 1, 0);
    expect(limiter.consume("a", 1, 1).allowed).toBe(false);
    expect(limiter.consume("b", 1, 1).allowed).toBe(true);
  });
});

describe("normalizeChatCompletionsUrl", () => {
  it("補上 /chat/completions 並移除結尾斜線", () => {
    expect(normalizeChatCompletionsUrl("https://x.com/v1/")).toBe("https://x.com/v1/chat/completions");
  });
  it("已含完整路徑就不重複加", () => {
    expect(normalizeChatCompletionsUrl("https://x.com/v1/chat/completions")).toBe("https://x.com/v1/chat/completions");
  });
  it("非 http(s) 網址報 badurl", () => {
    expect(() => normalizeChatCompletionsUrl("not-a-url")).toThrow(ProxyCallError);
  });
});

describe("callOpenAICompatibleProxy", () => {
  it("成功時帶 Bearer 金鑰、模型，並取出回覆文字", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gpt-4o-mini",
      choices: [{ message: { content: " 你為什麼會選 6 呢？ " } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenAICompatibleProxy(
      { base: "https://x.com/v1", key: "sk-1", model: "gpt-4o-mini" },
      [{ role: "user", content: "hi" }],
      100,
    );
    expect(result.content).toBe("你為什麼會選 6 呢？");
    expect(result.model).toBe("gpt-4o-mini");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://x.com/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer sk-1" });
    expect(JSON.parse((init as RequestInit).body as string).model).toBe("gpt-4o-mini");
  });

  it("沒填模型時用 gpt-4o-mini 預設", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "OK" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "k" }, [], 8);
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).model).toBe("gpt-4o-mini");
  });

  it("供應商回傳 usage 時透傳 token 用量", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gpt-4o-mini",
      choices: [{ message: { content: "OK" } }],
      usage: { prompt_tokens: 321, completion_tokens: 87, total_tokens: 408 },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "k" }, [], 8);
    expect(result.usage).toEqual({ promptTokens: 321, completionTokens: 87, totalTokens: 408 });
  });

  it("供應商未回傳 usage 時回 null，不猜測數字", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "OK" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "k" }, [], 8);
    expect(result.usage).toBeNull();
  });

  it("401 歸類為 auth 錯誤", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad key", { status: 401 })));
    await expect(
      callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "bad" }, [], 8),
    ).rejects.toMatchObject({ kind: "auth" });
  });

  it("404 歸類為 notfound", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 404 })));
    await expect(
      callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "k" }, [], 8),
    ).rejects.toMatchObject({ kind: "notfound" });
  });

  it("回覆結構缺 content 歸類 shape 錯誤", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ x: 1 }), { status: 200 })));
    await expect(
      callOpenAICompatibleProxy({ base: "https://x.com/v1", key: "k" }, [], 8),
    ).rejects.toMatchObject({ kind: "shape" });
  });
});

describe("buildReflectionMessages", () => {
  it("系統提示要求不直接給答案、一次一問、繁中", () => {
    const messages = buildReflectionMessages({ ...reflectInput, turn: "first" });
    const system = messages[0]!.content as string;
    expect(system).toContain("不直接說出答案");
    expect(system).toContain("一個");
  });

  it("答錯首輪與追問輪的任務導向不同，且上下文含選項但不含個人資料欄位", () => {
    const first = buildReflectionMessages({ ...reflectInput, turn: "first" });
    const more = buildReflectionMessages({ ...reflectInput, turn: "more" });
    expect(first[1]!.content as string).toContain("答錯");
    expect(more[1]!.content as string).toContain("不同角度");
    expect(first[1]!.content as string).toContain("A. 3");
    expect(first[1]!.content as string).not.toContain("姓名");
  });
});

describe("aiCompanion router", () => {
  it("testProxy 成功回報延遲與模型", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gpt-4o-mini",
      choices: [{ message: { content: "OK" } }],
    }), { status: 200 })));
    const result = await appRouter.createCaller(context).aiCompanion.testProxy({
      base: "https://x.com/v1", key: "sk", model: "gpt-4o-mini",
    });
    expect(result.ok).toBe(true);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("testProxy 遇到 401 拋 BAD_REQUEST 中文訊息", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 401 })));
    await expect(
      appRouter.createCaller(context).aiCompanion.testProxy({ base: "https://x.com/v1", key: "bad" }),
    ).rejects.toThrow(/金鑰/);
  });

  it("reflect 走自備代理成功，標記 source=proxy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gpt-4o-mini",
      choices: [{ message: { content: "你發現題目在問「合併」對吧？" } }],
    }), { status: 200 })));
    const result = await appRouter.createCaller(context).aiCompanion.reflect(reflectInput);
    expect(result.source).toBe("proxy");
    expect(result.text).toContain("合併");
    expect(result.remaining).toBe(REFLECT_LIMIT_PER_MIN - 1);
  });

  it("reflect 每分鐘超額後擋下（TOO_MANY_REQUESTS）", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "ok" } }],
    }), { status: 200 })));
    const caller = appRouter.createCaller(context);
    for (let i = 0; i < REFLECT_LIMIT_PER_MIN; i++) {
      await caller.aiCompanion.reflect(reflectInput);
    }
    await expect(caller.aiCompanion.reflect(reflectInput)).rejects.toThrow(/每分鐘/);
  });

  it("不同學生各自有獨立限額桶", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "ok" } }],
    }), { status: 200 })));
    const caller = appRouter.createCaller(context);
    for (let i = 0; i < REFLECT_LIMIT_PER_MIN; i++) {
      await caller.aiCompanion.reflect({ ...reflectInput, studentName: "小明" });
    }
    // 另一位學生仍可使用
    await expect(
      caller.aiCompanion.reflect({ ...reflectInput, studentName: "小美" }),
    ).resolves.toMatchObject({ source: "proxy" });
  });

  it("testProxy 同來源每分鐘超額也會被擋", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "OK" } }],
    }), { status: 200 })));
    const caller = appRouter.createCaller(context);
    for (let i = 0; i < PROXY_TEST_LIMIT_PER_MIN; i++) {
      await caller.aiCompanion.testProxy({ base: "https://x.com/v1", key: "k" });
    }
    await expect(
      caller.aiCompanion.testProxy({ base: "https://x.com/v1", key: "k" }),
    ).rejects.toThrow(/測試太頻繁/);
  });
});
