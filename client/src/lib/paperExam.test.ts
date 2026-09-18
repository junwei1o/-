import { describe, expect, it, vi } from "vitest";
import { buildPaperDeck, buildSubjectWrongReviewDeck, getPaperNextGroupStrategyHint, getPaperStrategyRecap, getReviewSelfCheckAdaptation, isMatchingQuestion, mixPaperMatching, mixPaperVariants, questionIndexToAltitude, scorePaper, type PaperQuestion } from "./paperExam";

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

describe("mixPaperMatching", () => {
  const twelve: PaperQuestion[] = Array.from({ length: 12 }, (_, i) => ({
    id: `c${i}`,
    grade: 4,
    subject: "數學" as const,
    difficulty: "標準",
    learningTopic: `數與量${i}`,
    prompt: `題目${i}`,
    options: ["A", "B"],
    answer: 0,
    explanation: "解析",
  }));

  it("12 題平常試卷混入 3 題迷你配對，插在整體第 5、10、15 題", () => {
    const mixed = mixPaperMatching(twelve, "數學", 3, () => 0.5);
    expect(mixed).toHaveLength(15);
    const positions = mixed
      .map((question, index) => (isMatchingQuestion(question) ? index + 1 : null))
      .filter((position): position is number => position !== null);
    expect(positions).toEqual([5, 10, 15]);
    const matching = mixed.filter(isMatchingQuestion);
    expect(matching).toHaveLength(3);
    for (const question of matching) {
      expect(question.subject).toBe("數學");
      expect(question.matchingSet?.pairs).toHaveLength(4);
      expect(question.matchingSet?.distractors).toHaveLength(1);
      expect(question.questionType).toBe("配對題");
    }
  });

  it("綜合卷可混入不同學科的配對題，且迷你盤不修改原 set", () => {
    const mixed = mixPaperMatching(twelve, "綜合課綱", 3, () => 0.7);
    const subjects = new Set(mixed.filter(isMatchingQuestion).map((question) => question.subject));
    expect(subjects.size).toBeGreaterThanOrEqual(1);
  });

  it("不足 12 題的短文卷（錯題重練、單題冒險）不混入配對", () => {
    const one = [twelve[0]];
    const result = mixPaperMatching(one, "綜合課綱", 3, () => 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c0");
    expect(isMatchingQuestion(result[0])).toBe(false);
  });

  it("選擇/是非題維持原結構，配對題不進選擇計分", () => {
    const mixed = mixPaperMatching(twelve, "數學", 3, () => 0.5);
    const choiceDeck = mixed.filter((question) => question.questionType !== "配對題");
    expect(choiceDeck).toHaveLength(12);
    expect(scorePaper(choiceDeck, { c0: 0 })).toMatchObject({ answered: 1, correct: 1, total: 12 });
  });
});

describe("mixPaperVariants", () => {
  const makeTwelve = (subject: PaperQuestion["subject"]): PaperQuestion[] =>
    Array.from({ length: 12 }, (_, i) => ({
      id: `${subject}-${i}`,
      grade: 4,
      subject,
      questionType: "選擇題" as const,
      difficulty: "標準" as const,
      learningTopic: `單元${i}`,
      prompt: `題目${i}`,
      options: ["A", "B", "C", "D"],
      answer: 0,
      explanation: "解析",
    }));

  it("12 題卷於整體第 5、10、15 題插入填空、配對、排序", () => {
    const mixed = mixPaperVariants(makeTwelve("數學"), "數學", () => 0.5);
    expect(mixed).toHaveLength(15);
    expect(mixed[4].questionType).toBe("填空題");
    expect(mixed[9].questionType).toBe("配對題");
    expect(mixed[14].questionType).toBe("排序題");
    // 原 12 題選擇題維持原相對順序
    const ordinary = mixed.filter((question) => question.questionType === "選擇題");
    expect(ordinary).toHaveLength(12);
  });

  it("填空題為字卡四選一、排序題帶 orderItems 且答案固定 0", () => {
    const mixed = mixPaperVariants(makeTwelve("自然"), "自然", () => 0.5);
    const fill = mixed[4];
    const order = mixed[14];
    expect(fill.options).toHaveLength(4);
    expect(fill.answer).toBeGreaterThanOrEqual(0);
    expect(order.orderItems?.length).toBeGreaterThanOrEqual(3);
    expect(order.answer).toBe(0);
    expect(order.options).toEqual([]);
  });

  it("英語卷沒有排序題時，第三槽以英語配對題遞補（仍是 15 題）", () => {
    const mixed = mixPaperVariants(makeTwelve("英語"), "英語", () => 0.5);
    expect(mixed).toHaveLength(15);
    expect(mixed[4].questionType).toBe("填空題");
    expect(mixed[9].questionType).toBe("配對題");
    expect(mixed[14].questionType).toBe("配對題");
    expect(mixed.filter((question) => question.subject !== "英語")).toHaveLength(0);
  });

  it("不足 12 題的短文卷不混入任何變體", () => {
    const short = makeTwelve("數學").slice(0, 5);
    const result = mixPaperVariants(short, "數學", () => 0.5);
    expect(result).toHaveLength(5);
    expect(result.every((question) => question.questionType === "選擇題")).toBe(true);
  });

  it("填空與排序併入選擇題計分（答對寫 0、答錯寫 -1）", () => {
    const mixed = mixPaperVariants(makeTwelve("社會"), "社會", () => 0.5);
    const choiceDeck = mixed.filter((question) => question.questionType !== "配對題");
    expect(choiceDeck).toHaveLength(14); // 12 選擇 + 填空 + 排序
    const fillId = mixed[4].id;
    const orderId = mixed[14].id;
    const scored = scorePaper(choiceDeck, { [fillId]: mixed[4].answer, [orderId]: 0 });
    expect(scored.incomplete).toBe(12);
    expect(scored.correct).toBe(2);
  });
});
