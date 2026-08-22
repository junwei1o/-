import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const input = {
  prompt: "小明有 3 顆蘋果，又買了 2 顆，一共有幾顆？",
  options: ["1 顆", "5 顆", "6 顆", "8 顆"],
  selectedAnswer: "6 顆",
  correctAnswer: "5 顆",
  subject: "數學",
  grade: 3,
  learningTopic: "加法",
  learningPerformance: "能使用加法解決生活問題",
  learningContent: "兩個一位數的合併",
  competency: "符號運用與溝通表達",
  officialExplanation: "把原有的 3 顆和新增的 2 顆合併，使用 3 + 2 = 5。",
  knowledge: ["加法", "數量合併"],
};

afterEach(() => vi.restoreAllMocks());

describe("aiTutor.explain", () => {
  it("parses a safe structured learning explanation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        initialHint: "先想想新增的數量要和原本的數量做什麼運算。",
        advancedHint: "先判斷題目是在合併數量，再把兩個數量放進同一個算式。",
        steps: ["找出原本的數量。", "找出新增的數量。", "把兩個數量相加。"],
        explanation: "題目要把 3 顆和 2 顆合併，所以是 3 + 2 = 5。",
        misconception: "看到 3 和 2 時不能直接相乘，因為題目描述的是合併數量。",
        encouragement: "你已經找到需要重新觀察的線索了！",
      }) } }],
    }), { status: 200 })));

    const result = await appRouter.createCaller(context).aiTutor.explain(input);
    expect(result.steps).toHaveLength(3);
    expect(result.initialHint).toContain("新增");
    expect(result.advancedHint).toContain("合併");
    expect(result.explanation).toContain("5");
  });

  it("rejects malformed model output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{not-json}" } }],
    }), { status: 200 })));

    await expect(appRouter.createCaller(context).aiTutor.explain(input)).rejects.toThrow("AI explanation format is invalid");
  });
});


describe("aiTutor.reviewPlan", () => {
  const reviewInput = {
    filters: { subject: "國語", reason: "基礎題需重看" },
    adaptation: { difficulty: "基礎" as const, optionCount: 2 as const, focusTopics: [{ topic: "閱讀理解", count: 1, highestDifficulty: "基礎" as const }] },
    questions: [{
      subject: "國語",
      difficulty: "基礎",
      learningTopic: "閱讀理解",
      prompt: "哪一句最能表達文章的主旨？",
      selectedAnswer: "只描述一個細節",
      correctAnswer: "說明文章的核心意思",
      officialExplanation: "先找出全文反覆支持的核心意思，再判斷主旨。",
    }],
  };

  it("parses a three-stage filtered review plan", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "閱讀理解短複習路線",
        summary: "先整理主旨與細節的關係，再做一題小練習。",
        focusAreas: [{ topic: "閱讀理解", reason: "先找出全文反覆支持的核心意思。" }],
        stages: [
          { key: "orientation", label: "先看方向", instruction: "先圈出文章中反覆出現的重點。" },
          { key: "practice", label: "做個小練習", instruction: "用兩分鐘寫下一句文章主旨。" },
          { key: "check", label: "自己檢查", instruction: "問自己：這句話能涵蓋全文嗎？" },
        ],
        encouragement: "一步一步整理，你會越來越穩。",
        selfCheck: {
          difficulty: "基礎",
          optionCount: 2,
          prompt: "文章主旨通常要涵蓋什麼？",
          options: ["全文的核心意思", "一個細節"],
          correctOption: 0,
          explanation: "主旨要能概括全文的核心意思。",
          encouragement: "你願意檢查自己的理解，就是很好的學習。",
          hints: [],
        },
      }) } }],
    }), { status: 200 })));

    const result = await appRouter.createCaller(context).aiTutor.reviewPlan(reviewInput);
    expect(result.focusAreas[0]?.topic).toBe("閱讀理解");
    expect(result.stages).toHaveLength(3);
    expect(result.stages[1]?.key).toBe("practice");
    expect(result.selfCheck.correctOption).toBe(0);
    expect(result.selfCheck.options).toHaveLength(2);
  });

  it("rejects malformed review plan output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{not-json}" } }],
    }), { status: 200 })));

    await expect(appRouter.createCaller(context).aiTutor.reviewPlan(reviewInput)).rejects.toThrow("AI review plan format is invalid");
  });
});
