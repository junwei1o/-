import { describe, expect, it } from "vitest";
import {
  answerRecordsFromLearningRecords,
  averageGuessRate,
  buildDiagnosis,
  calculateConfidence,
  deserializeDiagnosis,
  isDiagnosticallyValid,
  serializeDiagnosis,
  type AnswerRecord,
  type QuestionMeta,
} from "./studentDiagnosis";
import type { LearningRecord } from "@/utils/storage";

function rec(over: Partial<AnswerRecord> = {}): AnswerRecord {
  return {
    questionId: "q-1",
    knowledge: ["水的三態"],
    subject: "自然",
    curriculumDomain: "地球科學",
    learningTopic: "水的三態",
    difficulty: "基礎",
    questionType: "single-choice",
    correct: true,
    timeSpentMs: 15000,
    retryCount: 0,
    changedAnswer: false,
    skipped: false,
    timestamp: 1_700_000_000_000,
    sessionId: "s1",
    ...over,
  };
}

function repeat(n: number, over: Partial<AnswerRecord> = {}, t0 = 1_700_000_000_000): AnswerRecord[] {
  return Array.from({ length: n }, (_, i) => rec({ ...over, timestamp: t0 + i * 1000 }));
}

describe("calculateConfidence", () => {
  it("全對高於全錯", () => {
    const allRight = calculateConfidence(repeat(10, { correct: true }));
    const allWrong = calculateConfidence(repeat(10, { correct: false }));
    expect(allRight).toBeGreaterThan(allWrong);
  });

  it("未知用時（0）視為中性，不得當成「答太快」而被壓低", () => {
    const unknownTiming = calculateConfidence(repeat(10, { correct: true, timeSpentMs: 0 }));
    const idealTiming = calculateConfidence(repeat(10, { correct: true, timeSpentMs: 15000 }));
    const tooFast = calculateConfidence(repeat(10, { correct: true, timeSpentMs: 1000 }));

    expect(unknownTiming).toBeCloseTo(idealTiming, 5);
    expect(unknownTiming).toBeGreaterThan(tooFast);
  });

  it("樣本 < 10 時向 0.5 回歸", () => {
    const few = calculateConfidence(repeat(1, { correct: true }));
    expect(few).toBeLessThan(0.8); // 不會因單筆全對就給滿分
    expect(few).toBeGreaterThan(0.5);
  });

  it("跳過的作答不納入計算", () => {
    const withSkipped = calculateConfidence([
      ...repeat(5, { correct: true }),
      ...repeat(5, { correct: false, skipped: true }),
    ]);
    const clean = calculateConfidence(repeat(5, { correct: true }));
    expect(withSkipped).toBeCloseTo(clean, 5);
  });

  it("重做與改答次數多會降低信心", () => {
    const clean = calculateConfidence(repeat(10, { correct: true }));
    const messy = calculateConfidence(repeat(10, { correct: true, retryCount: 3, changedAnswer: true }));
    expect(messy).toBeLessThan(clean);
  });

  it("空陣列回 0", () => {
    expect(calculateConfidence([])).toBe(0);
  });
});

describe("buildDiagnosis", () => {
  it("樣本不足 minSampleSize 的知識點不列入統計", () => {
    const d = buildDiagnosis("小明", repeat(2, { knowledge: ["太少樣本"] }));
    expect(d.knowledgeStats["太少樣本"]).toBeUndefined();
  });

  it("一題多知識點會分別計入", () => {
    const d = buildDiagnosis("小明", repeat(3, { knowledge: ["A", "B"] }));
    expect(Object.keys(d.knowledgeStats).sort()).toEqual(["A", "B"]);
    expect(d.knowledgeStats["A"].totalAttempts).toBe(3);
  });

  it("低信心知識點會進到所屬領域的 weakKnowledge", () => {
    const d = buildDiagnosis("小明", repeat(5, { knowledge: ["弱點"], correct: false }));
    expect(d.domainStats["地球科學"].weakKnowledge).toContain("弱點");
  });

  it("整體正確率與總題數正確（排除 skipped）", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(3, { correct: true }),
      ...repeat(1, { correct: false }),
      ...repeat(2, { correct: false, skipped: true }),
    ]);
    expect(d.totalAnswers).toBe(4);
    expect(d.overallAccuracy).toBeCloseTo(0.75, 3);
  });

  it("趨勢：後半段正確率明顯提升→improving", () => {
    const t0 = 1_700_000_000_000;
    const records = [
      ...repeat(3, { correct: false }, t0),
      ...repeat(3, { correct: true }, t0 + 100_000),
    ];
    const d = buildDiagnosis("小明", records);
    expect(d.knowledgeStats["水的三態"].trend).toBe("improving");
  });

  it("難度與題型統計會分組", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(2, { difficulty: "基礎", questionType: "single-choice" }),
      ...repeat(2, { difficulty: "挑戰", questionType: "matching" }),
    ]);
    expect(Object.keys(d.difficultyStats).sort()).toEqual(["基礎", "挑戰"]); // UTF-16 序：基(U+57FA) < 挑(U+6311)
    expect(Object.keys(d.questionTypeStats).sort()).toEqual(["matching", "single-choice"]);
  });

  it("version 有寫入", () => {
    expect(buildDiagnosis("小明", repeat(3)).version).toBe(1);
  });
});

describe("generateInsights（透過 buildDiagnosis）", () => {
  it("盲點洞察為 high 且排在 positive 之前", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(5, { knowledge: ["盲點"], correct: false }),
      ...repeat(5, { knowledge: ["已會"], correct: true }),
    ]);
    const kinds = d.insights.map((i) => i.kind);
    expect(kinds).toContain("blindspot");
    const blindIdx = d.insights.findIndex((i) => i.kind === "blindspot");
    const masteredIdx = d.insights.findIndex((i) => i.kind === "mastered");
    expect(d.insights[blindIdx].severity).toBe("high");
    if (masteredIdx >= 0) expect(blindIdx).toBeLessThan(masteredIdx);
  });

  it("基礎與標準題落差 > 25% 產生 difficulty-gap", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(5, { difficulty: "基礎", correct: true }),
      ...repeat(5, { difficulty: "標準", correct: false }),
    ]);
    expect(d.insights.some((i) => i.kind === "difficulty-gap")).toBe(true);
  });

  it("題型落差 > 30% 產生 type-gap", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(5, { questionType: "single-choice", correct: true }),
      ...repeat(5, { questionType: "matching", correct: false }),
    ]);
    expect(d.insights.some((i) => i.kind === "type-gap")).toBe(true);
  });

  it("無資料時不產生任何洞察", () => {
    expect(buildDiagnosis("小明", []).insights).toEqual([]);
  });
});

describe("answerRecordsFromLearningRecords（與既有資料橋接）", () => {
  const learning: LearningRecord[] = [
    { questionId: "q-1", subject: "自然", isCorrect: true, timestamp: 1000, flagged: false },
    { questionId: "q-2", subject: "數學", isCorrect: false, timestamp: 2000, flagged: false },
  ];
  const meta = new Map<string, QuestionMeta>([
    [
      "q-1",
      {
        knowledge: ["水的三態"],
        difficulty: "基礎",
        questionType: "single-choice",
        curriculumDomain: "地球科學",
        learningTopic: "水的三態",
      },
    ],
  ]);

  it("join 題庫補齊知識點／難度／題型", () => {
    const [a] = answerRecordsFromLearningRecords(learning, meta, "sess-9");
    expect(a.knowledge).toEqual(["水的三態"]);
    expect(a.difficulty).toBe("基礎");
    expect(a.questionType).toBe("single-choice");
    expect(a.sessionId).toBe("sess-9");
  });

  it("缺漏的互動訊號以 unknown 表示（timeSpentMs=0）", () => {
    const [a] = answerRecordsFromLearningRecords(learning, meta);
    expect(a.timeSpentMs).toBe(0);
    expect(a.retryCount).toBe(0);
    expect(a.changedAnswer).toBe(false);
    expect(a.skipped).toBe(false);
  });

  it("題庫查不到時退回科目與預設值（不丟錯）", () => {
    const [, b] = answerRecordsFromLearningRecords(learning, meta);
    expect(b.knowledge).toEqual([]);
    expect(b.curriculumDomain).toBe("數學");
    expect(b.learningTopic).toBe("未分類");
    expect(b.difficulty).toBe("標準");
  });

  it("轉出的紀錄可直接餵給 buildDiagnosis（端到端不炸）", () => {
    const records = answerRecordsFromLearningRecords(learning, meta);
    const d = buildDiagnosis("小明", records);
    expect(d.totalAnswers).toBe(2);
  });
});

describe("序列化", () => {
  it("round-trip 可還原", () => {
    const d = buildDiagnosis("小明", repeat(3));
    const back = deserializeDiagnosis(serializeDiagnosis(d));
    expect(back?.captainName).toBe("小明");
    expect(back?.totalAnswers).toBe(3);
  });

  it("缺 version 或版本過新則回 null", () => {
    expect(deserializeDiagnosis("{}")).toBeNull();
    expect(deserializeDiagnosis(JSON.stringify({ version: 99 }))).toBeNull();
    expect(deserializeDiagnosis("not-json")).toBeNull();
  });
});

describe("猜對率修正（guessRate）", () => {
  it("正確率等於猜對率時，信心歸零（代表毫無把握）", () => {
    // 4 選 1：10 題對 2.5 題 ≈ 猜對率 0.25
    const records = [
      ...repeat(3, { correct: true, questionType: "single-choice" }),
      ...repeat(7, { correct: false, questionType: "single-choice" }),
    ];
    // accuracy = 0.3，接近 0.25 → adjusted ≈ 0.067
    const withGuess = calculateConfidence(records, 0.25);
    const withoutGuess = calculateConfidence(records, 0);
    expect(withGuess).toBeLessThan(withoutGuess);
    expect(withGuess).toBeLessThan(0.1);
  });

  it("全對時信心為 1.0，且與猜對率無關（完美就是完美）", () => {
    const perfect = repeat(10, { correct: true });
    expect(calculateConfidence(perfect, 0.5)).toBeCloseTo(1, 5);
    expect(calculateConfidence(perfect, 0.05)).toBeCloseTo(1, 5);
  });

  it("非滿分時，猜對率越高信心越低（是非題 0.5 vs 填空題 0.05）", () => {
    // 10 題對 8 題
    const imperfect = [
      ...repeat(8, { correct: true, questionType: "true-false" }),
      ...repeat(2, { correct: false, questionType: "true-false" }),
    ];
    const asTrueFalse = calculateConfidence(imperfect, 0.5);
    const asFillBlank = calculateConfidence(imperfect, 0.05);
    expect(asTrueFalse).toBeLessThan(asFillBlank);
    // 是非題 8/10：adjusted = (0.8-0.5)/0.5 = 0.6；填空 8/10：adjusted = (0.8-0.05)/0.95 ≈ 0.789
    expect(asTrueFalse).toBeCloseTo(0.6, 2);
  });

  it("averageGuessRate 依題型加權", () => {
    expect(averageGuessRate(repeat(3, { questionType: "true-false" }))).toBeCloseTo(0.5, 5);
    expect(averageGuessRate(repeat(3, { questionType: "fill-blank" }))).toBeCloseTo(0.05, 5);
    const mixed = averageGuessRate([
      ...repeat(1, { questionType: "true-false" }),
      ...repeat(1, { questionType: "single-choice" }),
    ]);
    expect(mixed).toBeCloseTo(0.375, 5);
  });
});

describe("診斷有效性過濾", () => {
  it("申論題不可計入診斷", () => {
    expect(isDiagnosticallyValid("open-ended")).toBe(false);
  });

  it("選擇／是非／配對可計入（是非題為 conditional＝納入但保守，不可排除）", () => {
    expect(isDiagnosticallyValid("single-choice")).toBe(true);
    expect(isDiagnosticallyValid("true-false")).toBe(true);
    expect(isDiagnosticallyValid("matching")).toBe(true);
  });

  it("題庫標籤（中文）也能對應", () => {
    expect(isDiagnosticallyValid("選擇題")).toBe(true);
  });

  it("未知題型不靜默丟棄（回 true，交由上層決定）", () => {
    expect(isDiagnosticallyValid("__future-type__")).toBe(true);
  });

  it("buildDiagnosis 會排除申論題紀錄", () => {
    const d = buildDiagnosis("小明", [
      ...repeat(5, { questionType: "single-choice", correct: true }),
      ...repeat(5, { questionType: "open-ended", correct: false }),
    ]);
    expect(d.totalAnswers).toBe(5);
    expect(d.questionTypeStats["open-ended"]).toBeUndefined();
  });

  it("單科診斷會回填 subject", () => {
    const d = buildDiagnosis("小明", repeat(3), { subject: "自然" });
    expect(d.subject).toBe("自然");
  });
});
