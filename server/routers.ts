import { synthesizeSpeech } from "./tts";
import { TARGETED_PRACTICE_ITEMS, summarizeTargetedPractice } from "./targetedPractice";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  createAssignment,
  deleteClass,
  purgeStudentName,
  removeClassMember,
  createClass,
  createCloudSave,
  getClassRow,
  getCloudSave,
  ensureQuestionBankReady,
  createAnnouncement,
  getQuestionBank,
  insertExamRecord,
  joinClass,
  listAnnouncements,
  listCloudSaveNames,
  listAssignments,
  listClassMembers,
  listClassesOfStudent,
  listExamRecords,
  listSubmissions,
  deleteAnnouncement,
  submitAssignment,
  updateCloudSave,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

/** 雲端船籍名字：2–6 個中文字或英數字（如「張三」「小航海士02」）。 */
const cloudNameSchema = z.string().trim().min(2, "名字至少 2 個字").max(6, "名字最多 6 個字").regex(/^[一-鿿A-Za-z0-9]+$/, "名字請用中文字或英數字");

/** 雲端存檔內容：rpg/bx 原始 JSON 字串＋版本號，大小由 express 50mb 上限把關。 */
const cloudPayloadSchema = z.object({
  v: z.literal(1),
  rpg: z.string().nullable(),
  bx: z.string().nullable(),
  savedAt: z.number().int().positive(),
});

const cloudMetricsSchema = z.object({
  coins: z.number().int().min(0).max(10_000_000),
  totalAnswers: z.number().int().min(0).max(10_000_000),
  badges: z.number().int().min(0).max(100_000),
});

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
              content: "你是台灣國小 3–6 年級的學習陪伴者。只根據使用者提供的題目、答案與課綱資料回答，不得捏造課綱或額外事實。請使用繁體中文、溫和且清楚的語氣；不要責備學生，也不要直接只說答案。在進階提示或解題步驟中，可自然融入一個與此題學科相符的答題技巧（例如：提醒學生先圈出題幹關鍵字與「正確／不正確」判斷詞、數學題用代入驗證或特殊值法並檢查單位、社會題注意時間順序並排除說法太絕對的選項、自然題先看實驗的操縱變因與數據趨勢），但不要生硬條列或灌輸超過一個技巧。輸出必須符合指定 JSON schema。",
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
              content: "你是台灣國小 3–6 年級的學習陪伴者。只根據提供的錯題資料與既有解析回答，不得捏造課綱、學生資料或額外事實。請使用繁體中文、溫和而具體的語氣，產生低干擾的分段複習建議。不要責備學生，不要一次塞入長篇解答；第一段只做方向整理，第二段才給一個可執行的小練習，第三段才給自我檢查方式。在方向整理中，請依錯題所屬學科自然加入一個具體的答題習慣建議（例如：答題前先圈關鍵字、卡住超過兩分鐘先跳過、數學用驗證法並檢查單位、社會注意時間軸與絕對化說法、自然看清「正確／不正確」），一次只提醒一個，不要長篇條列。輸出必須符合指定 JSON schema。",
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

    /**
     * 維運用：回報題庫同步狀態並補齊缺題（冪等，只補 id 不存在的題目）。
     * 擴充題庫後若啟動時同步失敗，可呼叫此端點重試，不必進主機看日誌。
     */
    sync: publicProcedure.mutation(async () => {
      const report = await ensureQuestionBankReady();
      return report;
    }),
  }),
  /**
   * 針對性練習備用題庫：只在「錯題重練」時頂替原題用，不進正式試卷與作業。
   * 分量比主庫小，前端按需載入並在記憶體快取，離線時退回同知識點輪替。
   */
  targetedPractice: router({
    list: publicProcedure
      .input(z.object({ subject: z.enum(["數學", "自然", "社會", "國語"]).optional() }).optional())
      .query(async ({ input }) => {
        const items = input?.subject
          ? TARGETED_PRACTICE_ITEMS.filter((item) => item.subject === input.subject)
          : TARGETED_PRACTICE_ITEMS;
        return { items, total: items.length };
      }),

    /** 維運用：看備用題庫覆蓋了幾個知識點、資料是否載入成功。 */
    stats: publicProcedure.query(() => summarizeTargetedPractice()),
  }),
  // 雲端船籍：以孩子自選名字（2–6 字，無密碼）為鍵的免註冊雲端存檔。
  // 內容僅學習進度（金幣/島嶼/徽章/作答統計），不含個資；名字即身分，認船畫面以防誤登。
  cloud: router({
    register: publicProcedure
      .input(z.object({
        name: cloudNameSchema,
        payload: cloudPayloadSchema,
        metrics: cloudMetricsSchema,
      }))
      .mutation(async ({ input }) => {
        const created = await createCloudSave({ name: input.name, payload: input.payload, ...input.metrics });
        if (!created) return { ok: false as const, reason: "taken" as const };
        return { ok: true as const };
      }),
    load: publicProcedure
      .input(z.object({ name: cloudNameSchema }))
      .query(async ({ input }) => {
        const row = await getCloudSave(input.name);
        if (!row) return { ok: false as const, reason: "notFound" as const };
        return {
          ok: true as const,
          save: {
            name: row.name,
            payload: row.payload,
            coins: row.coins,
            totalAnswers: row.totalAnswers,
            badges: row.badges,
            updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Date.now(),
          },
        };
      }),
    save: publicProcedure
      .input(z.object({
        name: cloudNameSchema,
        payload: cloudPayloadSchema,
        metrics: cloudMetricsSchema,
      }))
      .mutation(async ({ input }) => {
        const updated = await updateCloudSave(input.name, input.payload, input.metrics);
        if (!updated) {
          // 船籍不存在（例如換裝置初次同步）：直接建立，讓同步不中斷。
          await createCloudSave({ name: input.name, payload: input.payload, ...input.metrics });
        }
        return { ok: true as const };
      }),
    recordExam: publicProcedure
      .input(z.object({
        name: cloudNameSchema,
        subject: z.string().trim().min(1).max(32),
        grade: z.number().int().min(1).max(12).optional(),
        difficulty: z.string().trim().min(1).max(16).optional(),
        totalQuestions: z.number().int().min(1).max(100),
        correctCount: z.number().int().min(0).max(100),
        detail: z.unknown().optional(),
        /** 同一份試卷的識別碼：帶了就是覆蓋更新（學生補標錯誤原因時會再報一次）。 */
        sessionKey: z.string().trim().min(1).max(160).optional(),
      }).refine((v) => v.correctCount <= v.totalQuestions, { message: "correctCount exceeds totalQuestions" }))
      .mutation(async ({ input }) => {
        await insertExamRecord({
          name: input.name,
          subject: input.subject,
          grade: input.grade ?? null,
          difficulty: input.difficulty ?? null,
          totalQuestions: input.totalQuestions,
          correctCount: input.correctCount,
          detail: input.detail ?? null,
          sessionKey: input.sessionKey ?? null,
        });
        return { ok: true as const };
      }),
    listExams: publicProcedure
      .input(z.object({ name: cloudNameSchema, limit: z.number().int().min(1).max(50).optional() }))
      .query(async ({ input }) => {
        const rows = await listExamRecords(input.name, input.limit ?? 10);
        return {
          records: rows.map((row) => ({
            id: row.id,
            subject: row.subject,
            difficulty: row.difficulty,
            totalQuestions: row.totalQuestions,
            correctCount: row.correctCount,
            createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
          })),
        };
      }),
  }),
  teacher: router({
    /** 建立班級並取得 6 位班級碼。 */
    createClass: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1, "請填班級名稱").max(40),
        teacherName: z.string().trim().min(1, "請填老師稱呼").max(24),
      }))
      .mutation(async ({ input }) => {
        const created = await createClass(input.name, input.teacherName);
        if (!created) return { ok: false as const, reason: "retry" as const };
        return { ok: true as const, ...created };
      }),

    /** 以班級碼讀取班級（老師看板用）。 */
    getClass: publicProcedure
      .input(z.object({ code: z.string().trim().min(4).max(8) }))
      .query(async ({ input }) => {
        const row = await getClassRow(input.code.trim().toUpperCase());
        if (!row) return { ok: false as const, reason: "notFound" as const };
        return {
          ok: true as const,
          classInfo: {
            code: row.code,
            name: row.name,
            teacherName: row.teacherName,
            createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
          },
        };
      }),

    /** 學生加入班級。 */
    joinClass: publicProcedure
      .input(z.object({
        code: z.string().trim().min(4).max(8),
        studentName: cloudNameSchema,
      }))
      .mutation(async ({ input }) => joinClass(input.code.trim().toUpperCase(), input.studentName)),

    /** 學生查詢自己已加入的班級。 */
    myClasses: publicProcedure
      .input(z.object({ studentName: cloudNameSchema }))
      .query(async ({ input }) => ({ classes: await listClassesOfStudent(input.studentName) })),

    /** 移除班級中的一位學生（連帶清掉他的繳交與作答紀錄）。 */
    removeMember: publicProcedure
      .input(z.object({
        classCode: z.string().trim().min(4).max(8),
        studentName: z.string().trim().min(1).max(24),
      }))
      .mutation(async ({ input }) => {
        await removeClassMember(input.classCode.trim().toUpperCase(), input.studentName.trim());
        return { ok: true as const };
      }),

    /** 刪除班級（成員、作業、繳交紀錄全清）。 */
    deleteClass: publicProcedure
      .input(z.object({ classCode: z.string().trim().min(4).max(8) }))
      .mutation(async ({ input }) => {
        await deleteClass(input.classCode.trim().toUpperCase());
        return { ok: true as const };
      }),

    /**
     * 清除某個船名的所有雲端痕跡（船籍＋作答紀錄＋班級成員身分）。
     * 用來清測試帳號，或孩子打錯船名重取後不想留舊資料。
     */
    purgeStudent: publicProcedure
      .input(z.object({ studentName: z.string().trim().min(1).max(24) }))
      .mutation(async ({ input }) => {
        await purgeStudentName(input.studentName.trim());
        return { ok: true as const };
      }),

    /**
     * 尚未加入本班的船籍名單。
     * 小班場景裡要孩子手輸 6 位班級碼很麻煩，這裡讓老師直接看到
     * 「誰已經取了船名但還沒進班」，點一下就加入。
     */
    joinCandidates: publicProcedure
      .input(z.object({ classCode: z.string().trim().min(4).max(8) }))
      .query(async ({ input }) => {
        const code = input.classCode.trim().toUpperCase();
        const [saves, members] = await Promise.all([listCloudSaveNames(), listClassMembers(code)]);
        const joined = new Set(members.map((row) => row.studentName));
        return {
          candidates: saves
            .filter((row) => !joined.has(row.name))
            .map((row) => ({
              name: row.name,
              totalAnswers: row.totalAnswers ?? 0,
              updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : 0,
            })),
        };
      }),

    /** 老師指派作業。 */
    createAssignment: publicProcedure
      .input(z.object({
        classCode: z.string().trim().min(4).max(8),
        subject: z.enum(["國語", "數學", "自然", "社會", "綜合課綱"]),
        grade: z.number().int().min(3).max(6),
        questionCount: z.number().int().min(5).max(30),
        /** 知識點：有值時學生端的這份作業只會出該知識點的題。 */
        learningTopic: z.string().trim().min(1).max(255).optional(),
        /** 指定學生：有值時只有這位學生看得到這份作業。 */
        studentName: z.string().trim().min(1).max(24).optional(),
        dueDate: z.string().trim().max(10).optional(),
      }))
      .mutation(async ({ input }) => {
        const code = input.classCode.trim().toUpperCase();
        const target = await getClassRow(code);
        if (!target) return { ok: false as const, reason: "notFound" as const };
        const created = await createAssignment({
          classCode: code,
          subject: input.subject,
          grade: input.grade,
          questionCount: input.questionCount,
          learningTopic: input.learningTopic ?? null,
          studentName: input.studentName ?? null,
          dueDate: input.dueDate ?? null,
        });
        return { ok: true as const, id: created.id };
      }),

    /**
     * 出作業時的知識點選項：列出某科目下有哪些知識點、各有多少題。
     * 老師從督學台看到學生的薄弱點後，可以直接挑同一個知識點出作業。
     */
    topicOptions: publicProcedure
      .input(z.object({
        subject: z.enum(["國語", "數學", "自然", "社會"]),
        grade: z.number().int().min(3).max(6).optional(),
      }))
      .query(async ({ input }) => {
        const rows = await getQuestionBank({ subject: input.subject, limit: 1000 });
        const counter = new Map<string, number>();
        for (const row of rows) {
          if (input.grade && row.grade !== input.grade) continue;
          counter.set(row.learningTopic, (counter.get(row.learningTopic) ?? 0) + 1);
        }
        const topics = Array.from(counter.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, "zh-Hant"));
        return { topics };
      }),

    /** 列出班級作業。帶 studentName 時只回傳「全班」或「指定給他」的作業。 */
    listAssignments: publicProcedure
      .input(z.object({
        classCode: z.string().trim().min(4).max(8),
        studentName: z.string().trim().min(1).max(24).optional(),
      }))
      .query(async ({ input }) => {
        const rows = await listAssignments(input.classCode.trim().toUpperCase());
        const mine = input.studentName
          ? rows.filter((row) => !row.studentName || row.studentName === input.studentName)
          : rows;
        return {
          assignments: mine.map((row) => ({
            id: row.id,
            subject: row.subject,
            grade: row.grade,
            questionCount: row.questionCount,
            learningTopic: row.learningTopic,
            studentName: row.studentName,
            dueDate: row.dueDate,
            createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
          })),
        };
      }),

    /** 繳交作業成績。 */
    submitAssignment: publicProcedure
      .input(z.object({
        assignmentId: z.number().int().positive(),
        studentName: cloudNameSchema,
        correctCount: z.number().int().min(0),
        totalQuestions: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        if (input.correctCount > input.totalQuestions) return { ok: false as const, reason: "invalidScore" as const };
        await submitAssignment({
          assignmentId: input.assignmentId,
          studentName: input.studentName,
          correctCount: input.correctCount,
          totalQuestions: input.totalQuestions,
        });
        return { ok: true as const };
      }),

    /**
     * 單一學生的學習洞察：正確率與**薄弱知識點**。
     * 小班（1 老師 2 學生）場景下，老師最需要的是「這孩子哪裡不會」，
     * 而不是籠統的正確率，所以這裡直接從逐題明細聚合出錯最多的知識點。
     */
    studentInsights: publicProcedure
      .input(z.object({
        studentName: cloudNameSchema,
        days: z.number().int().min(1).max(365).optional(),
      }))
      .query(async ({ input }) => {
        const records = await listExamRecords(input.studentName, 100);
        const cutoff = Date.now() - (input.days ?? 30) * 86_400_000;
        const recent = records.filter((row) => {
          const time = row.createdAt instanceof Date ? row.createdAt.getTime() : 0;
          return time >= cutoff;
        });

        const totalQuestions = recent.reduce((sum, row) => sum + row.totalQuestions, 0);
        const correctCount = recent.reduce((sum, row) => sum + row.correctCount, 0);

        type TopicStat = { subject: string; topic: string; total: number; wrong: number };
        const stats = new Map<string, TopicStat>();
        // 錯誤歸因：學生自評的「為什麼錯」。正確率只看得出「哪裡不會」，
        // 這裡才看得出「為什麼不會」——粗心與概念不清，老師該給的幫助完全不同。
        const errorCounts: Record<string, number> = { concept: 0, careless: 0, memory: 0 };
        let errorTagged = 0;

        for (const row of recent) {
          const detail = row.detail as {
            topics?: Array<{ subject?: string; topic?: string; correct?: boolean; errorType?: string | null }>;
          } | null;
          for (const item of detail?.topics ?? []) {
            if (!item?.topic) continue;
            const subject = item.subject ?? row.subject;
            const key = `${subject}/${item.topic}`;
            const current = stats.get(key) ?? { subject, topic: item.topic, total: 0, wrong: 0 };
            current.total += 1;
            if (!item.correct) current.wrong += 1;
            stats.set(key, current);

            const taggedType = item.errorType;
            if (
              !item.correct &&
              (taggedType === "concept" || taggedType === "careless" || taggedType === "memory")
            ) {
              errorCounts[taggedType] += 1;
              errorTagged += 1;
            }
          }
        }
        const weakTopics = Array.from(stats.values())
          .filter((item) => item.wrong > 0)
          .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
          .slice(0, 5);

        // 依數量排序的錯誤歸因（只回有值的），供老師端顯示「這孩子多數是粗心還是真不懂」。
        const errorPatterns = (["concept", "careless", "memory"] as const)
          .map((type) => ({ type, count: errorCounts[type] }))
          .filter((item) => item.count > 0)
          .sort((a, b) => b.count - a.count);

        return {
          exams: recent.length,
          totalQuestions,
          correctCount,
          accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
          weakTopics,
          errorPatterns,
          errorTaggedWrong: errorTagged,
        };
      }),

    /** 班級報表：成員 × 作業的完成與正確率矩陣。 */
    classReport: publicProcedure
      .input(z.object({ classCode: z.string().trim().min(4).max(8) }))
      .query(async ({ input }) => {
        const code = input.classCode.trim().toUpperCase();
        const target = await getClassRow(code);
        if (!target) return { ok: false as const, reason: "notFound" as const };
        const [members, homework] = await Promise.all([listClassMembers(code), listAssignments(code)]);
        const submissionLists = await Promise.all(homework.map((item) => listSubmissions(item.id)));
        const submissionsByAssignment = new Map(homework.map((item, index) => [item.id, submissionLists[index]]));

        const students = members.map((member) => {
          // 只算派給全班或指定給他的作業，避免「只給阿明」的作業灌到小華的完成率。
          const myHomework = homework.filter((item) => !item.studentName || item.studentName === member.studentName);
          const scores = myHomework.map((item, index) => {
            const hit = (submissionsByAssignment.get(item.id) ?? []).find((row) => row.studentName === member.studentName);
            return {
              assignmentId: item.id,
              done: Boolean(hit),
              correctCount: hit?.correctCount ?? 0,
              totalQuestions: hit?.totalQuestions ?? item.questionCount,
            };
          });
          const doneCount = scores.filter((score) => score.done).length;
          const correctSum = scores.reduce((sum, score) => sum + score.correctCount, 0);
          const totalSum = scores.reduce((sum, score) => sum + score.totalQuestions, 0);
          return {
            studentName: member.studentName,
            joinedAt: member.joinedAt instanceof Date ? member.joinedAt.getTime() : Date.now(),
            doneCount,
            assignmentCount: myHomework.length,
            accuracy: totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : 0,
            scores,
          };
        });

        return {
          ok: true as const,
          classInfo: { code: target.code, name: target.name, teacherName: target.teacherName },
          assignments: homework.map((item) => ({
            id: item.id,
            subject: item.subject,
            grade: item.grade,
            questionCount: item.questionCount,
            learningTopic: item.learningTopic,
            studentName: item.studentName,
            dueDate: item.dueDate,
          })),
          students,
        };
      }),

    /** 老師發一則班級公告。 */
    postAnnouncement: publicProcedure
      .input(z.object({
        classCode: z.string().trim().min(4).max(8),
        teacherName: z.string().trim().min(1).max(24),
        content: z.string().trim().min(1, "公告內容不可為空").max(500),
      }))
      .mutation(async ({ input }) => {
        const code = input.classCode.trim().toUpperCase();
        const cls = await getClassRow(code);
        if (!cls) return { ok: false as const, reason: "classNotFound" as const };
        const { id } = await createAnnouncement({
          classCode: code,
          teacherName: input.teacherName.trim(),
          content: input.content.trim(),
        });
        return { ok: true as const, id };
      }),

    /** 列出某班級最新公告（學生/老師皆可調用，按 classCode 過濾）。 */
    listAnnouncements: publicProcedure
      .input(z.object({
        classCode: z.string().trim().min(4).max(8),
        limit: z.number().int().min(1).max(50).optional(),
      }))
      .query(async ({ input }) => {
        const code = input.classCode.trim().toUpperCase();
        const rows = await listAnnouncements(code, input.limit ?? 10);
        return rows.map((row) => ({
          id: row.id,
          classCode: row.classCode,
          teacherName: row.teacherName,
          content: row.content,
          createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
        }));
      }),

    /** 老師刪除自己的公告。 */
    deleteAnnouncement: publicProcedure
      .input(z.object({
        id: z.number().int().min(1),
        classCode: z.string().trim().min(4).max(8),
        teacherName: z.string().trim().min(1).max(24),
      }))
      .mutation(async ({ input }) => {
        return deleteAnnouncement(input.id, input.classCode.trim().toUpperCase(), input.teacherName.trim());
      }),
  }),
  tts: router({
    /**
     * 朗讀合成（Edge TTS）。離線或服務不可用時回 audio:null，
     * 前端會自動退回瀏覽器內建語音——朗讀按鈕永遠有聲音，只是音質不同。
     */
    synthesize: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(600),
          voice: z.enum(["hsiaochen", "hsiaoyu", "yunjhe", "xiaoxiao"]).optional(),
          rate: z.number().min(0.5).max(2).optional(),
        }),
      )
      .query(async ({ input }) => {
        const audio = await synthesizeSpeech(input);
        return audio ? { audio: audio.toString("base64"), mime: "audio/mpeg" } : { audio: null };
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
