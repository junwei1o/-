import { describe, expect, it } from "vitest";
import {
  RUSHED_WRONG_MS,
  SLOW_CORRECT_MS,
  averageMs,
  readExamTopicRows,
  summarizeExamTopics,
  type ExamTopicRow,
} from "./insights";

const topic = (over: Partial<ExamTopicRow> = {}): ExamTopicRow => ({
  subject: "數學",
  topic: "分數加減",
  correct: true,
  ...over,
});

describe("readExamTopicRows", () => {
  it("讀得出 topics 陣列", () => {
    expect(readExamTopicRows({ topics: [topic()] })).toHaveLength(1);
  });

  it("格式不對時回空陣列而不是拋錯", () => {
    expect(readExamTopicRows(null)).toEqual([]);
    expect(readExamTopicRows(undefined)).toEqual([]);
    expect(readExamTopicRows({})).toEqual([]);
    expect(readExamTopicRows({ topics: "壞資料" })).toEqual([]);
  });
});

describe("summarizeExamTopics - 薄弱知識點", () => {
  it("沒有資料時全部為空，不會產生 NaN", () => {
    const summary = summarizeExamTopics([], "數學");
    expect(summary.weakTopics).toEqual([]);
    expect(summary.errorPatterns).toEqual([]);
    expect(summary.errorTaggedWrong).toBe(0);
    expect(summary.speed.sampleCount).toBe(0);
    expect(summary.speed.averageMs).toBe(0);
  });

  it("只列出錯誤率高於 0 的知識點，全對的不列入", () => {
    const summary = summarizeExamTopics([
      topic({ topic: "面積", correct: true }),
      topic({ topic: "面積", correct: true }),
      topic({ topic: "時間換算", correct: false }),
      topic({ topic: "時間換算", correct: true }),
    ], "數學");

    expect(summary.weakTopics.map((item) => item.topic)).toEqual(["時間換算"]);
    expect(summary.weakTopics[0]).toMatchObject({ total: 2, wrong: 1 });
  });

  it("錯誤率高的優先；同錯誤率時錯得多的優先", () => {
    const summary = summarizeExamTopics([
      // 分數：2/2 全錯（錯誤率 100%，錯 2）
      topic({ topic: "分數加減", correct: false }),
      topic({ topic: "分數加減", correct: false }),
      // 面積：1/1 全錯（錯誤率 100%，錯 1）→ 應排在分數後面
      topic({ topic: "面積", correct: false }),
      // 時間：1/4 錯（錯誤率 25%）
      topic({ topic: "時間換算", correct: false }),
      topic({ topic: "時間換算", correct: true }),
      topic({ topic: "時間換算", correct: true }),
      topic({ topic: "時間換算", correct: true }),
    ], "數學");

    expect(summary.weakTopics.map((item) => item.topic)).toEqual(["分數加減", "面積", "時間換算"]);
  });

  it("缺少 subject 時用 fallbackSubject 補上", () => {
    const summary = summarizeExamTopics([
      { topic: "平均數", correct: false },
    ], "自然");
    expect(summary.weakTopics[0].subject).toBe("自然");
  });

  it("沒有 topic 的列直接忽略", () => {
    const summary = summarizeExamTopics([
      { correct: false, errorType: "concept" },
      topic({ topic: undefined }),
      topic(),
    ], "數學");
    expect(summary.weakTopics).toEqual([]);
    expect(summary.errorPatterns).toEqual([]);
  });
});

describe("summarizeExamTopics - 錯誤型態", () => {
  it("只採計學生自評過的原因；未自評（null）不可算成任何一類", () => {
    const summary = summarizeExamTopics([
      topic({ correct: false, errorType: "careless" }),
      topic({ correct: false, errorType: null }),
      topic({ correct: false }),
      topic({ correct: false, errorType: "concept" }),
    ], "數學");

    expect(summary.errorTaggedWrong).toBe(2);
    // 數量相同時維持固定順序（概念 → 粗心 → 記憶），觀念問題優先呈現給老師。
    expect(summary.errorPatterns).toEqual([
      { type: "concept", count: 1 },
      { type: "careless", count: 1 },
    ]);
  });

  it("答對的題目即使帶原因也不計入", () => {
    const summary = summarizeExamTopics([
      topic({ correct: true, errorType: "careless" }),
    ], "數學");
    expect(summary.errorTaggedWrong).toBe(0);
    expect(summary.errorPatterns).toEqual([]);
  });

  it("數量多的型態排在前面", () => {
    const summary = summarizeExamTopics([
      topic({ correct: false, errorType: "memory" }),
      topic({ correct: false, errorType: "careless" }),
      topic({ correct: false, errorType: "careless" }),
    ], "數學");
    expect(summary.errorPatterns[0]).toEqual({ type: "careless", count: 2 });
  });
});

describe("summarizeExamTopics - 作答速度", () => {
  it("平均秒數分別統計整體、答對、答錯", () => {
    const summary = summarizeExamTopics([
      topic({ correct: true, responseMs: 4_000 }),
      topic({ correct: true, responseMs: 6_000 }),
      topic({ correct: false, responseMs: 10_000 }),
    ], "數學");

    expect(summary.speed.sampleCount).toBe(3);
    expect(summary.speed.averageMs).toBe(6_667); // (4000+6000+10000)/3
    expect(summary.speed.correctAverageMs).toBe(5_000);
    expect(summary.speed.wrongAverageMs).toBe(10_000);
  });

  it("快速答錯與慢速答對會被單獨計數（老師要知道這兩種極端）", () => {
    const summary = summarizeExamTopics([
      topic({ correct: false, responseMs: 2_000 }),   // 快速答錯 → 像猜的
      topic({ correct: false, responseMs: 9_000 }),   // 想了一下才錯
      topic({ correct: true, responseMs: 21_000 }),   // 慢速答對 → 還不熟
      topic({ correct: true, responseMs: 5_000 }),    // 正常
    ], "數學");

    expect(summary.speed.rushedWrongCount).toBe(1);
    expect(summary.speed.slowCorrectCount).toBe(1);
  });

  it("門檻為含端點：正好 5 秒算快速答錯，正好 20 秒算慢速答對", () => {
    const summary = summarizeExamTopics([
      topic({ correct: false, responseMs: RUSHED_WRONG_MS }),
      topic({ correct: true, responseMs: SLOW_CORRECT_MS }),
    ], "數學");

    expect(summary.speed.rushedWrongCount).toBe(1);
    expect(summary.speed.slowCorrectCount).toBe(1);
  });

  it("缺少或非法的 responseMs 不計入樣本（舊紀錄沒有速度資料）", () => {
    const summary = summarizeExamTopics([
      topic({ correct: true }),
      topic({ correct: true, responseMs: null }),
      topic({ correct: true, responseMs: 0 }),
      topic({ correct: true, responseMs: -5 }),
      topic({ correct: true, responseMs: Number.NaN }),
    ], "數學");

    expect(summary.speed.sampleCount).toBe(0);
  });

  it("慢速答對與快速答錯的計數不會互相污染", () => {
    const summary = summarizeExamTopics([
      topic({ correct: true, responseMs: 1_000 }),    // 快速但答對 → 不算任何極端
      topic({ correct: false, responseMs: 24_000 }),  // 慢但答錯 → 不算任何極端
    ], "數學");

    expect(summary.speed.rushedWrongCount).toBe(0);
    expect(summary.speed.slowCorrectCount).toBe(0);
  });
});

describe("averageMs", () => {
  it("空陣列回 0（不是 NaN）", () => {
    expect(averageMs([])).toBe(0);
  });

  it("四捨五入到整數毫秒", () => {
    expect(averageMs([1_000, 1_001])).toBe(1_001);
    expect(averageMs([1_000, 1_000, 1_001])).toBe(1_000);
  });
});
