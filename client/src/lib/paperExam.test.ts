import { describe, expect, it, vi } from "vitest";
import { buildPaperDeck, buildSubjectWrongReviewDeck, getPaperNextGroupStrategyHint, getPaperStrategyRecap, getReviewSelfCheckAdaptation, questionIndexToAltitude, scorePaper, type PaperQuestion } from "./paperExam";

const questions: PaperQuestion[] = [
  { id: "l", grade: 4, subject: "國語", difficulty: "基礎", learningTopic: "詞義", prompt: "題目", options: ["A", "B"], answer: 0, explanation: "解析" },
  { id: "m", grade: 4, subject: "數學", difficulty: "基礎", learningTopic: "數與量", prompt: "題目", options: ["A", "B"], answer: 1, explanation: "解析" },
  { id: "n", grade: 4, subject: "自然", difficulty: "基礎", learningTopic: "生物", prompt: "題目", options: ["A", "B"], answer: 0, explanation: "解析" },
  { id: "s", grade: 4, subject: "社會", difficulty: "基礎", learningTopic: "地方", prompt: "題目", options: ["A", "B"], answer: 1, explanation: "解析" },
  { id: "m2", grade: 5, subject: "數學", difficulty: "標準", learningTopic: "幾何", prompt: "題目", options: ["A", "B"], answer: 0, explanation: "解析" },
];

describe("paper exam deck", () => {
  it("綜合試卷會保留四個課綱科目的題目", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const deck = buildPaperDeck(questions, "綜合課綱", 5);
    expect(new Set(deck.map((question) => question.subject))).toEqual(new Set(["國語", "數學", "自然", "社會"]));
    vi.restoreAllMocks();
  });

  it("單科試卷不會混入其他科目", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(buildPaperDeck(questions, "數學", 12).every((question) => question.subject === "數學")).toBe(true);
    vi.restoreAllMocks();
  });

  it("錯題重練只帶入同科最後一次仍未答對的真實紀錄，並以最近紀錄優先", () => {
    const deck = buildSubjectWrongReviewDeck(questions, [
      { questionId: "m", correct: false, timestamp: 100 },
      { questionId: "m", correct: true, timestamp: 200 },
      { questionId: "m2", correct: false, timestamp: 300 },
      { questionId: "s", correct: false, timestamp: 400 },
      { questionId: "not-in-bank", correct: false, timestamp: 500 },
    ], "數學");

    expect(deck.map((question) => question.id)).toEqual(["m2"]);
    expect(deck.every((question) => question.subject === "數學")).toBe(true);
  });

  it("交卷統計會分辨已作答、正確與未作答題目", () => {
    expect(scorePaper(questions.slice(0, 3), { l: 0, m: 0 })).toMatchObject({ answered: 2, correct: 1, total: 3, incomplete: 1 });
  });

  it("將實際作答數映射為玉山高度，並安全處理空題組與超出範圍的值", () => {
    expect(questionIndexToAltitude(0, 12)).toBe(0);
    expect(questionIndexToAltitude(6, 12)).toBe(1976);
    expect(questionIndexToAltitude(12, 12)).toBe(3952);
    expect(questionIndexToAltitude(99, 12)).toBe(3952);
    expect(questionIndexToAltitude(2, 0)).toBe(0);
  });

  it("只依本組實際學科與知識點整理正向策略，不帶入答案或正誤紀錄", () => {
    const recap = getPaperStrategyRecap([questions[0], questions[1], questions[4]]);

    expect(recap.title).toBe("把剛才的解題技巧帶到下一次");
    expect(recap.strategies).toEqual([
      "國語閱讀策略：先標出關鍵詞與前後文關係，再回題幹核對自己的想法。",
      "數學觀察策略：先整理題目中的量、單位與關係，再一步一步檢查。",
    ]);
    expect(recap.knowledgeTopics).toEqual(["詞義", "數與量", "幾何"]);
    expect(recap.summary).not.toContain("正確");
  });

  it("為每個可選試卷範圍提供不揭示答案的下一組策略提示", () => {
    expect(getPaperNextGroupStrategyHint("國語")).toEqual({
      subjectLabel: "國語準備提示",
      tip: "先圈出題幹中的關鍵詞，再回前後文找能支持自己想法的線索。",
    });
    expect(getPaperNextGroupStrategyHint("數學").tip).toContain("量和單位");
    expect(getPaperNextGroupStrategyHint("自然").tip).toContain("現象與條件");
    expect(getPaperNextGroupStrategyHint("社會").tip).toContain("人物、情境與資料來源");
    expect(getPaperNextGroupStrategyHint("綜合課綱").tip).toContain("題幹與條件");
    expect(getPaperNextGroupStrategyHint("國語").tip).not.toContain("答案");
  });

  it("重複的基礎知識點會升為標準難度並使用三個選項", () => {
    expect(getReviewSelfCheckAdaptation([
      { learningTopic: "詞義", difficulty: "基礎" },
      { learningTopic: "詞義", difficulty: "基礎" },
    ])).toMatchObject({ difficulty: "標準", optionCount: 3, focusTopics: [{ topic: "詞義", count: 2 }] });
  });

  it("挑戰知識點會使用挑戰難度與四個選項", () => {
    expect(getReviewSelfCheckAdaptation([{ learningTopic: "天文觀測", difficulty: "挑戰" }])).toMatchObject({ difficulty: "挑戰", optionCount: 4 });
  });

  it("沒有錯題時安全回退到基礎二選一", () => {
    expect(getReviewSelfCheckAdaptation([])).toMatchObject({ difficulty: "基礎", optionCount: 2, focusTopics: [] });
  });
});
