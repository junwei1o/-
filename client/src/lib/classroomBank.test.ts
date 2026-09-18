// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  FILL_QUESTIONS,
  ORDER_QUESTIONS,
  TRAP_CATEGORIES,
  TRAP_QUESTIONS,
  accuracyStars,
  buildChoiceDeck,
  buildImageQuiz,
  buildRelayRounds,
  buildTrueFalseDeck,
  fillToPaper,
  loadClassroomBest,
  orderToPaper,
  saveClassroomBest,
  trapStars,
} from "./classroomBank";
import { IMAGE_MATCHING_SETS } from "./matchingBank";

// 固定亂數序列，讓洗牌結果可重現。
function seeded(seed = 0.42) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

describe("教室題庫載入", () => {
  it("填空 24、排序 16、陷阱 30 題全數載入", () => {
    expect(FILL_QUESTIONS).toHaveLength(24);
    expect(ORDER_QUESTIONS).toHaveLength(16);
    expect(TRAP_QUESTIONS).toHaveLength(30);
  });

  it("填空題都有 ____、4 張字卡與合法答案", () => {
    for (const question of FILL_QUESTIONS) {
      expect(question.prompt).toContain("____");
      expect(question.options).toHaveLength(4);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
    }
  });

  it("排序題都有 3–5 個不重複的排序項目", () => {
    for (const question of ORDER_QUESTIONS) {
      expect(question.items.length).toBeGreaterThanOrEqual(3);
      expect(question.items.length).toBeLessThanOrEqual(5);
      expect(new Set(question.items).size).toBe(question.items.length);
    }
  });

  it("陷阱題十大類別各 3 題，且都帶陷阱解析", () => {
    expect(TRAP_CATEGORIES).toHaveLength(10);
    for (const category of TRAP_CATEGORIES) {
      expect(TRAP_QUESTIONS.filter((q) => q.category === category)).toHaveLength(3);
    }
    for (const question of TRAP_QUESTIONS) {
      expect(question.trapNote.length).toBeGreaterThan(5);
      expect(question.options).toHaveLength(4);
    }
  });
});

describe("題庫轉換", () => {
  it("fillToPaper 產生填空題 PaperQuestion", () => {
    const paper = fillToPaper(FILL_QUESTIONS[0]);
    expect(paper.questionType).toBe("填空題");
    expect(paper.options).toHaveLength(4);
    expect(paper.answer).toBe(FILL_QUESTIONS[0].answer);
  });

  it("orderToPaper 答案固定為 0、選項留空、帶 orderItems", () => {
    const paper = orderToPaper(ORDER_QUESTIONS[0]);
    expect(paper.questionType).toBe("排序題");
    expect(paper.answer).toBe(0);
    expect(paper.options).toEqual([]);
    expect(paper.orderItems).toEqual(ORDER_QUESTIONS[0].items);
  });
});

describe("教室玩法題庫構造", () => {
  it("buildChoiceDeck 回傳指定數量的四選一", () => {
    const deck = buildChoiceDeck(10, "綜合", seeded());
    expect(deck).toHaveLength(10);
    for (const question of deck) {
      expect(question.options).toHaveLength(4);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
    }
  });

  it("buildTrueFalseDeck 補充題可把題庫補滿 12 題，選項固定正確/錯誤", () => {
    const deck = buildTrueFalseDeck(12, seeded());
    expect(deck).toHaveLength(12);
    for (const question of deck) {
      expect(question.options).toEqual(["正確", "錯誤"]);
      expect(question.answer === 0 || question.answer === 1).toBe(true);
    }
  });

  it("buildImageQuiz 每題帶圖片、4 個選項，且正解在選項中", () => {
    for (const set of IMAGE_MATCHING_SETS) {
      const quiz = buildImageQuiz(set, seeded());
      expect(quiz).toHaveLength(6);
      for (const question of quiz) {
        expect(question.img).toBeTruthy();
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options).size).toBe(4);
        expect(question.options).toContain(question.answer);
      }
    }
  });

  it("buildRelayRounds 每回合選擇題與配對盤同學科、配對 4 對＋1 干擾", () => {
    const rounds = buildRelayRounds(3, seeded());
    expect(rounds).toHaveLength(3);
    const setIds = new Set<string>();
    for (const round of rounds) {
      expect(round.choice.options).toHaveLength(4);
      expect(round.matching.subject).toBe(round.choice.subject);
      expect(round.matching.pairs).toHaveLength(4);
      expect(round.matching.distractors.length + round.matching.pairs.length).toBeGreaterThanOrEqual(5);
      setIds.add(round.matching.id);
    }
    // 三回合不重複用同一組配對
    expect(setIds.size).toBe(3);
  });
});

describe("教室計分", () => {
  it("accuracyStars 全對 3 星、七成以上 2 星、其餘 1 星", () => {
    expect(accuracyStars(10, 10)).toBe(3);
    expect(accuracyStars(7, 10)).toBe(2);
    expect(accuracyStars(6, 10)).toBe(1);
    expect(accuracyStars(0, 10)).toBe(1);
  });

  it("trapStars 零失誤 3 星、錯 1–2 題 2 星", () => {
    expect(trapStars(0)).toBe(3);
    expect(trapStars(2)).toBe(2);
    expect(trapStars(5)).toBe(1);
  });
});

describe("教室最佳紀錄（local-first）", () => {
  afterEach(() => localStorage.clear());

  it("預設為空物件，save/load 往返一致", () => {
    expect(loadClassroomBest()).toEqual({});
    saveClassroomBest({ flip: { stars: 3, correct: 10, total: 10 }, rush: { score: 120 } });
    const loaded = loadClassroomBest();
    expect(loaded.flip?.stars).toBe(3);
    expect(loaded.rush?.score).toBe(120);
  });
});
