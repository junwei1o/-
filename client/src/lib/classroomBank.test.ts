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
  meteorChainBonus,
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
  it("三波隨機組合：首波考 2 或 5，波波不重複，每波 7 目標＋9 干擾", () => {
    const waves = buildMeteorWaves(3, seeded());
    expect(waves).toHaveLength(3);
    const multiples = waves.map((w) => w.multipleOf);
    expect(new Set(multiples).size).toBe(3); // 波波不重複
    expect([2, 5].includes(multiples[0])).toBe(true); // 首波個位數特徵暖身
    for (const multiple of multiples.slice(1)) {
      expect([3, 9, 10].includes(multiple)).toBe(true);
    }
    for (const wave of waves) {
      expect(wave.hint.length).toBeGreaterThan(0);
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

  it("多輪隨機會出現不同組合（重玩性）", () => {
    const combos = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      const waves = buildMeteorWaves(3, seeded(0.1 + i * 0.07));
      combos.add(waves.map((w) => w.multipleOf).join("-"));
    }
    expect(combos.size).toBeGreaterThan(1);
  });

  it("「同時是 2 和 5 的倍數」波：干擾全是 2 或 5 的倍數陷阱（但不是 10 的倍數）", () => {
    const waves = buildMeteorWaves(3, seeded());
    const shared = waves.find((w) => w.multipleOf === 10);
    if (!shared) return; // 該輪沒抽到就跳過
    const decoys = shared.meteors.filter((m) => !m.isTarget);
    expect(decoys.length).toBe(9);
    for (const meteor of decoys) {
      expect(meteor.value % 2 === 0 || meteor.value % 5 === 0).toBe(true);
      expect(meteor.value % 10).not.toBe(0);
    }
  });

  it("3／9 的倍數波：目標隕石符合數字和特徵", () => {
    const waves = buildMeteorWaves(3, seeded());
    for (const wave of waves) {
      if (wave.multipleOf !== 3 && wave.multipleOf !== 9) continue;
      const digitSum = (n: number) => String(n).split("").reduce((sum, d) => sum + Number(d), 0);
      for (const meteor of wave.meteors) {
        expect(meteor.isTarget).toBe(digitSum(meteor.value) % wave.multipleOf === 0);
      }
    }
  });

  it("meteorStars 零失誤 3 星、≤4 二星、其餘 1 星", () => {
    expect(meteorStars(0)).toBe(3);
    expect(meteorStars(4)).toBe(2);
    expect(meteorStars(5)).toBe(1);
  });

  it("每波 1–2 顆炸彈：前三顆絕無炸彈、炸彈不是目標、目標數不變", () => {
    for (let i = 0; i < 8; i += 1) {
      const waves = buildMeteorWaves(3, seeded(0.2 + i * 0.11));
      for (const wave of waves) {
        const bombs = wave.meteors.filter((m) => m.isBomb);
        expect(bombs.length).toBeGreaterThanOrEqual(1);
        expect(bombs.length).toBeLessThanOrEqual(2);
        for (const bomb of bombs) {
          expect(bomb.isTarget).toBe(false);
        }
        // 前三顆（delay 最早的）不能是炸彈
        const firstThree = [...wave.meteors]
          .sort((a, b) => a.delayMs - b.delayMs)
          .slice(0, 3);
        for (const meteor of firstThree) {
          expect(meteor.isBomb).toBe(false);
        }
        // 目標數維持 7（炸彈只替換干擾隕石）
        expect(wave.meteors.filter((m) => m.isTarget)).toHaveLength(7);
      }
    }
  });

  it("meteorChainBonus 連斬計分：10／25／40", () => {
    expect(meteorChainBonus(0)).toBe(0);
    expect(meteorChainBonus(1)).toBe(10);
    expect(meteorChainBonus(2)).toBe(25);
    expect(meteorChainBonus(3)).toBe(40);
  });
});
