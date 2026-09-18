// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  FILL_QUESTIONS,
  ORDER_QUESTIONS,
  TRAP_CATEGORIES,
  TRAP_QUESTIONS,
  accuracyStars,
  buildChoiceDeck,
  buildFactorRounds,
  buildImageQuiz,
  buildRelayRounds,
  buildTrueFalseDeck,
  factorPairs,
  factorStars,
  fillToPaper,
  listFactors,
  loadClassroomBest,
  meteorStars,
  buildMeteorWaves,
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

describe("因數探險", () => {
  it("listFactors 正確列舉合成數、完全平方數與質數", () => {
    expect(listFactors(12)).toEqual([1, 2, 3, 4, 6, 12]);
    expect(listFactors(18)).toEqual([1, 2, 3, 6, 9, 18]);
    expect(listFactors(16)).toEqual([1, 2, 4, 8, 16]);
    expect(listFactors(25)).toEqual([1, 5, 25]);
    expect(listFactors(23)).toEqual([1, 23]);
    expect(listFactors(1)).toEqual([1]);
  });

  it("factorPairs 兩兩相乘等於 n，攤平後即全部因數；平方數含自己成對", () => {
    for (const n of [12, 18, 20, 45, 16, 25, 23, 60]) {
      const pairs = factorPairs(n);
      for (const [a, b] of pairs) expect(a * b).toBe(n);
      const flat = pairs.flatMap(([a, b]) => (a === b ? [a] : [a, b]));
      expect([...flat].sort((x, y) => x - y)).toEqual(listFactors(n));
    }
    expect(factorPairs(16)).toContainEqual([4, 4]);
    expect(factorPairs(25)).toContainEqual([5, 5]);
    expect(factorPairs(23)).toEqual([[1, 23]]);
  });

  it("buildFactorRounds 5 關：泡泡含全部因數、干擾都不是因數、無重複且 ≤9 個", () => {
    const rounds = buildFactorRounds(5, seeded());
    expect(rounds).toHaveLength(5);
    for (const round of rounds) {
      // 無重複數字
      expect(new Set(round.choices).size).toBe(round.choices.length);
      // 每個因數都在泡泡裡，1 與 n 一定是因數
      for (const factor of round.factors) expect(round.choices).toContain(factor);
      expect(round.choices).toContain(1);
      expect(round.choices).toContain(round.n);
      // 干擾項保證無法整除 n，且不會混入真因數
      for (const distractor of round.distractors) {
        expect(round.n % distractor).not.toBe(0);
        expect(round.factors).not.toContain(distractor);
      }
      expect(round.choices.length).toBeLessThanOrEqual(9);
    }
  });

  it("第 4 關為完全平方數、第 5 關為質數驚喜關", () => {
    const rounds = buildFactorRounds(5, seeded());
    const square = rounds[3];
    expect(square.kind).toBe("square");
    const root = Math.round(Math.sqrt(square.n));
    expect(root * root).toBe(square.n);
    expect(square.factors).toContain(root);

    const prime = rounds[4];
    expect(prime.kind).toBe("prime");
    expect(prime.factors).toEqual([1, prime.n]);
    expect(prime.pairs).toEqual([[1, prime.n]]);
  });

  it("factorStars 零失誤 3 星、失誤 ≤3 二星、其餘 1 星", () => {
    expect(factorStars(0)).toBe(3);
    expect(factorStars(3)).toBe(2);
    expect(factorStars(8)).toBe(1);
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

describe("倍數防衛戰題庫", () => {
  it("三波分別考 2、5、10 的倍數，每波 7 目標＋9 干擾、時間遞增", () => {
    const waves = buildMeteorWaves(3, seeded());
    expect(waves).toHaveLength(3);
    expect(waves.map((w) => w.multipleOf)).toEqual([2, 5, 10]);
    for (const wave of waves) {
      expect(wave.meteors).toHaveLength(16);
      const targets = wave.meteors.filter((m) => m.isTarget);
      expect(targets).toHaveLength(7);
      for (const meteor of wave.meteors) {
        expect(meteor.value).toBeGreaterThanOrEqual(10);
        expect(meteor.value).toBeLessThanOrEqual(99);
        expect(meteor.isTarget).toBe(meteor.value % wave.multipleOf === 0);
        expect(meteor.x).toBeGreaterThanOrEqual(12);
        expect(meteor.x).toBeLessThanOrEqual(88);
        expect(meteor.durationMs).toBeGreaterThanOrEqual(3800);
      }
      const delays = wave.meteors.map((m) => m.delayMs);
      expect([...delays].sort((a, b) => a - b)).toEqual(delays);
      // 最後一顆要在波次時間（42s）內落地
      const last = wave.meteors[wave.meteors.length - 1];
      expect(last.delayMs + last.durationMs).toBeLessThan(42_000);
    }
  });

  it("第三波干擾全是「2 或 5 的倍數」陷阱（但不是 10 的倍數）", () => {
    const waves = buildMeteorWaves(3, seeded());
    const decoys = waves[2].meteors.filter((m) => !m.isTarget);
    expect(decoys.length).toBeGreaterThan(0);
    for (const meteor of decoys) {
      expect(meteor.value % 2 === 0 || meteor.value % 5 === 0).toBe(true);
      expect(meteor.value % 10).not.toBe(0);
    }
  });

  it("meteorStars 零失誤 3 星、≤4 二星、其餘 1 星", () => {
    expect(meteorStars(0)).toBe(3);
    expect(meteorStars(4)).toBe(2);
    expect(meteorStars(5)).toBe(1);
  });
});
