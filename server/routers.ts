import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getQuestionBank } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  aiTutor: router({
    explain: publicProcedure
      .input(z.object({
        prompt: z.string().trim().min(1).max(2000),
        options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
        selectedAnswer: z.string().trim().min(1).max(500),
        correctAnswer: z.string().trim().min(1).max(500),
        subject: z.string().trim().min(1).max(80),
        grade: z.number().int().min(3).max(6),
        learningTopic: z.string().trim().max(300),
        learningPerformance: z.string().trim().max(500),
        learningContent: z.string().trim().max(500),
        competency: z.string().trim().max(500),
        officialExplanation: z.string().trim().max(1500),
        knowledge: z.array(z.string().trim().min(1).max(100)).max(10),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是台灣國小 3–6 年級的學習陪伴者。只根據使用者提供的題目、答案與課綱資料回答，不得捏造課綱或額外事實。請使用繁體中文、溫和且清楚的語氣；不要責備學生，也不要直接只說答案。輸出必須符合指定 JSON schema。",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: "學生答錯了這一題，請產生初步提示、進階提示、兩到四個解題步驟、詳細但適合兒童閱讀的解答、可能的迷思與鼓勵語。初步提示只能引導觀察方向，進階提示可以提供解題策略但不得直接揭露答案，完整解答才說明正確答案。",
                question: input,
              }),
            },
          ],
          max_tokens: 900,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "learning_error_explanation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  initialHint: { type: "string", description: "第一層、不直接揭露答案的觀察提示" },
                  advancedHint: { type: "string", description: "第二層、提供解題策略但不直接揭露答案的進階提示" },
                  steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                  explanation: { type: "string", description: "適合國小學生的詳細解答" },
                  misconception: { type: "string", description: "可能混淆的概念與修正方式" },
                  encouragement: { type: "string", description: "一句鼓勵學生的話" },
                },
                required: ["initialHint", "advancedHint", "steps", "explanation", "misconception", "encouragement"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("AI response content is unavailable");
        try {
          const result = JSON.parse(content);
          return z.object({
            initialHint: z.string().min(1).max(1200),
            advancedHint: z.string().min(1).max(1600),
            steps: z.array(z.string().min(1).max(600)).min(2).max(4),
            explanation: z.string().min(1).max(2500),
            misconception: z.string().min(1).max(1200),
            encouragement: z.string().min(1).max(300),
          }).parse(result);
        } catch {
          throw new Error("AI explanation format is invalid");
        }
      }),
    reviewPlan: publicProcedure
      .input(z.object({
        questions: z.array(z.object({
          subject: z.string().trim().min(1).max(80),
          difficulty: z.string().trim().min(1).max(40),
          learningTopic: z.string().trim().min(1).max(300),
          prompt: z.string().trim().min(1).max(700),
          selectedAnswer: z.string().trim().min(1).max(500),
          correctAnswer: z.string().trim().min(1).max(500),
          officialExplanation: z.string().trim().min(1).max(1200),
        })).min(1).max(12),
        filters: z.object({
          subject: z.string().trim().min(1).max(80),
          reason: z.string().trim().min(1).max(80),
        }),
        adaptation: z.object({
          difficulty: z.enum(["基礎", "標準", "挑戰"]),
          optionCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
          focusTopics: z.array(z.object({ topic: z.string().trim().min(1).max(160), count: z.number().int().min(1).max(12), highestDifficulty: z.enum(["基礎", "標準", "挑戰"]) })).max(2),
        }),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是台灣國小 3–6 年級的學習陪伴者。只根據提供的錯題資料與既有解析回答，不得捏造課綱、學生資料或額外事實。請使用繁體中文、溫和而具體的語氣，產生低干擾的分段複習建議。不要責備學生，不要一次塞入長篇解答；第一段只做方向整理，第二段才給一個可執行的小練習，第三段才給自我檢查方式。輸出必須符合指定 JSON schema。",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: "根據目前篩選出的錯題，整理一份專屬複習計畫。請找出最多兩個共同學習重點；每個重點提供一個短標題與一句原因。再提供三段依序揭示的建議：orientation 只指出先看什麼，practice 提供一個不超過兩分鐘的練習，check 提供一句自我檢查問題。複習建議最後請設計一題低壓力、只有一個正確答案的自我檢查題。請嚴格使用 adaptation.difficulty 作為題目難度，並產生恰好 adaptation.optionCount 個選項；難度只需驗證目前重點，不要加入新知識。只有當 adaptation.difficulty 是挑戰時，才提供 1–2 個分段提示；提示只能引導觀察重點或解題步驟，不得包含正確選項、正確答案或直接消去到只剩一個選項。基礎與標準題的提示欄位請回傳空陣列。最後給一句鼓勵。不要直接重述所有題目，不要揭露未被資料支持的答案。",
                filters: input.filters,
                adaptation: input.adaptation,
                wrongQuestions: input.questions,
              }),
            },
          ],
          max_tokens: 900,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "filtered_wrong_answer_review_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "複習計畫標題" },
                  summary: { type: "string", description: "一到兩句低干擾總結" },
                  focusAreas: {
                    type: "array",
                    minItems: 1,
                    maxItems: 2,
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["topic", "reason"],
                      additionalProperties: false,
                    },
                  },
                  stages: {
                    type: "array",
                    minItems: 3,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string", enum: ["orientation", "practice", "check"] },
                        label: { type: "string" },
                        instruction: { type: "string" },
                      },
                      required: ["key", "label", "instruction"],
                      additionalProperties: false,
                    },
                  },
                  encouragement: { type: "string" },
                  selfCheck: {
                    type: "object",
                    properties: {
                      prompt: { type: "string", description: "一題低壓力的自我檢查題" },
                      difficulty: { type: "string", enum: ["基礎", "標準", "挑戰"], description: "依自適應規則產生的題目難度" },
                      optionCount: { type: "integer", enum: [2, 3, 4], description: "實際選項數量" },
                      options: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
                      correctOption: { type: "integer", minimum: 0, maximum: 3, description: "正確選項的索引" },
                      explanation: { type: "string", description: "選答後顯示的簡短解析" },
                      encouragement: { type: "string", description: "答題後的溫和回饋" },
                      hints: { type: "array", minItems: 0, maxItems: 2, items: { type: "string" }, description: "僅挑戰題使用的分段引導，不得揭示正確答案" },
                    },
                    required: ["difficulty", "optionCount", "prompt", "options", "correctOption", "explanation", "encouragement", "hints"],
                    additionalProperties: false,
                  },
                },
                required: ["title", "summary", "focusAreas", "stages", "encouragement", "selfCheck"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("AI review plan content is unavailable");
        try {
          const result = JSON.parse(content);
          return z.object({
            title: z.string().min(1).max(160),
            summary: z.string().min(1).max(500),
            focusAreas: z.array(z.object({ topic: z.string().min(1).max(160), reason: z.string().min(1).max(300) })).min(1).max(2),
            stages: z.array(z.object({ key: z.enum(["orientation", "practice", "check"]), label: z.string().min(1).max(80), instruction: z.string().min(1).max(500) })).length(3),
            encouragement: z.string().min(1).max(240),
            selfCheck: z.object({
              difficulty: z.enum(["基礎", "標準", "挑戰"]),
              optionCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
              prompt: z.string().min(1).max(500),
              options: z.array(z.string().min(1).max(240)).min(2).max(4),
              correctOption: z.number().int().min(0).max(3),
              explanation: z.string().min(1).max(500),
              encouragement: z.string().min(1).max(240),
              hints: z.array(z.string().min(1).max(240)).max(2),
            }).superRefine((check, ctx) => {
              if (check.correctOption >= check.options.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctOption is outside options" });
              if (check.options.length !== check.optionCount) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "optionCount does not match options" });
              if (check.difficulty !== input.adaptation.difficulty) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "difficulty does not match adaptation" });
              if (check.optionCount !== input.adaptation.optionCount) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "optionCount does not match adaptation" });
              if (check.difficulty !== "挑戰" && check.hints.length > 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "hints are only allowed for challenge" });
            }),
          }).parse(result);
        } catch {
          throw new Error("AI review plan format is invalid");
        }
      }),
    progressSummary: publicProcedure
      .input(z.object({
        helpTrend: z.array(z.object({ label: z.string().trim().min(1).max(40), hintRate: z.number().min(0).max(100), attempts: z.number().int().min(1).max(100) })).max(12),
        masteryTrend: z.array(z.object({ label: z.string().trim().min(1).max(40), topics: z.array(z.object({ tag: z.string().trim().min(1).max(120), mastery: z.number().min(0).max(100), attempts: z.number().int().min(1).max(100) })).max(8) })).max(12),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是台灣國小學生的學習陪伴者。只根據提供的真實趨勢數據說明變化，不得虛構進步、原因、分數或不存在的紀錄。請使用繁體中文、正向、具體、溫和且不誇大的語氣。求助習慣與知識點掌握度必須分開說明；提示使用不是扣分。輸出必須符合 JSON schema。" },
            { role: "user", content: JSON.stringify({ task: "請產生本期進步摘要：第一句說明求助習慣的可觀察變化，第二句說明知識點掌握度的可觀察變化，第三句給一個不超過 20 字的下一步鼓勵。若資料不足，請明確說目前仍在累積觀測，不要推測。", data: input }) },
          ],
          max_tokens: 320,
          response_format: { type: "json_schema", json_schema: { name: "learning_progress_summary", strict: true, schema: { type: "object", properties: { help: { type: "string", description: "求助習慣趨勢摘要，提示使用不扣分" }, mastery: { type: "string", description: "知識點掌握度趨勢摘要" }, nextStep: { type: "string", description: "一句短的正向下一步" } }, required: ["help", "mastery", "nextStep"], additionalProperties: false } } },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("AI progress summary content is unavailable");
        try {
          return z.object({ help: z.string().min(1).max(260), mastery: z.string().min(1).max(260), nextStep: z.string().min(1).max(120) }).parse(JSON.parse(content));
        } catch {
          throw new Error("AI progress summary format is invalid");
        }
      }),
  }),
  questionBank: router({
    list: publicProcedure
      .input(z.object({
        grade: z.number().int().min(3).max(6).optional(),
        subject: z.enum(["數學", "自然", "社會", "國語"]).optional(),
        difficulty: z.enum(["基礎", "標準", "挑戰"]).optional(),
        curriculumDomain: z.enum(["語文領域", "數學領域", "自然科學領域", "社會領域"]).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      }).optional())
      .query(async ({ input }) => {
        const questions = await getQuestionBank(input ?? {});
        return { questions, total: questions.length };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

});

export type AppRouter = typeof appRouter;
