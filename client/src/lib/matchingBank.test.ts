import { describe, expect, it } from "vitest";
import extraBankRaw from "../../../data/matching_bank_extra.json";
import {
  IMAGE_MATCHING_SETS,
  MATCHING_SETS,
  MATCHING_SUBJECTS,
  buildMatchingBoard,
  formatMatchingTime,
  gradeRangeCeiling,
  buildRushQuestions,
  matchingStars,
  pickMatchingSet,
  shuffleArray,
  sliceMatchingSet,
  type MatchingSet,
} from "./matchingBank";

// 簡單可重現的偽亂數，讓洗牌結果在測試中固定。
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

describe("配對題庫資料", () => {
  it("過濾國中內容後各科仍有十幾組以上的內容配對（不再只有 6 組）", () => {
    // 2026-10-16（05 的 E2f）：99 → 85。原基線含 matching_bank_extra 的 14 組
    // 「7-9年級」國中內容，違反產品決策（內容等級上限六年級，MAX_GRADE=6），
    // 已在 MATCHING_SETS 源頭過濾。這是**設計變更**不是測試寫錯——
    // 舊斷言 `>=18` 鎖的是「含國中組」的舊基線，同步下調為 `>=15`。
    expect(MATCHING_SETS).toHaveLength(85);
    for (const subject of MATCHING_SUBJECTS) {
      const count = MATCHING_SETS.filter((set) => set.subject === subject).length;
      expect(count, `${subject} 配對組數`).toBeGreaterThanOrEqual(15);
    }
  });

  it("⭐ 國小池不得含 7-9 年級內容（E2f 回歸鎖）", () => {
    // 這 14 組曾是「到不了使用者」（誤報），實為會混進國小試卷；源頭過濾後必須缺席。
    for (const set of MATCHING_SETS) {
      const ceiling = gradeRangeCeiling(set.grade);
      expect(ceiling === null || ceiling <= 6, `${set.id} grade=${set.grade}`).toBe(true);
    }
    // 資料檔本身仍有這些組（保留、未刪除）——過濾只發生在池構建處。
    const rawExtra = (extraBankRaw as { sets: MatchingSet[] }).sets;
    expect(rawExtra.filter((set) => gradeRangeCeiling(set.grade) === 9)).toHaveLength(14);
  });

  it("每組 id 唯一、含 6 對與 2 個干擾，且左右值不重複", () => {
    const ids = new Set<string>();
    for (const set of MATCHING_SETS) {
      expect(ids.has(set.id)).toBe(false);
      ids.add(set.id);
      expect(set.pairs).toHaveLength(6);
      expect(set.distractors).toHaveLength(2);
      const lefts = set.pairs.map((pair) => pair.l);
      const rights = [...set.pairs.map((pair) => pair.r), ...set.distractors];
      expect(new Set(lefts).size).toBe(6);
      expect(new Set(rights).size).toBe(rights.length);
    }
  });
});

describe("buildMatchingBoard", () => {
  const set = MATCHING_SETS[0] as MatchingSet;

  it("排出 6 個左欄配對與 8 個右欄項目（含 2 個干擾）", () => {
    const board = buildMatchingBoard(set, seeded(7));
    expect(board.leftOrder).toHaveLength(6);
    expect([...board.leftOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(board.rightItems).toHaveLength(8);
    expect(board.rightItems.filter((item) => item.pair === -1)).toHaveLength(2);
    const rightTexts = board.rightItems.map((item) => item.text).sort();
    const expected = [...set.pairs.map((pair) => pair.r), ...set.distractors].sort();
    expect(rightTexts).toEqual(expected);
  });

  it("注入相同亂數時產生相同排列", () => {
    const a = buildMatchingBoard(set, seeded(42));
    const b = buildMatchingBoard(set, seeded(42));
    expect(a.leftOrder).toEqual(b.leftOrder);
    expect(a.rightItems.map((item) => item.key)).toEqual(b.rightItems.map((item) => item.key));
  });
});

describe("純函式", () => {
  it("gradeRangeCeiling 解析範圍／單年級，無法解析回 null", () => {
    expect(gradeRangeCeiling("3-4年級")).toBe(4);
    expect(gradeRangeCeiling("7-9年級")).toBe(9);
    expect(gradeRangeCeiling("6年級")).toBe(6);
    expect(gradeRangeCeiling(" 4 - 5 年級 ")).toBe(5);
    expect(gradeRangeCeiling("unknown")).toBeNull();
  });

  it("shuffleArray 不改變元素集合，且可由亂數重現", () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffleArray(source, seeded(1)).slice().sort((a, b) => a - b)).toEqual(source);
    expect(shuffleArray(source, seeded(3))).toEqual(shuffleArray(source, seeded(3)));
    expect(source).toEqual([1, 2, 3, 4, 5]); // 不改原陣列
  });

  it("matchingStars 依失誤數給星", () => {
    expect(matchingStars(0)).toBe(3);
    expect(matchingStars(1)).toBe(2);
    expect(matchingStars(2)).toBe(2);
    expect(matchingStars(3)).toBe(1);
    expect(matchingStars(9)).toBe(1);
  });

  it("pickMatchingSet 綜合卷隨機取任一、單科只取該科", () => {
    expect(pickMatchingSet("綜合課綱", seeded(2))).not.toBeNull();
    for (let i = 0; i < 10; i += 1) {
      const english = pickMatchingSet("英語", seeded(i + 1));
      expect(english?.subject).toBe("英語");
    }
    const math = pickMatchingSet("數學", seeded(99));
    expect(math?.subject).toBe("數學");
  });

  it("formatMatchingTime 格式化為 m:ss", () => {
    expect(formatMatchingTime(0)).toBe("0:00");
    expect(formatMatchingTime(65000)).toBe("1:05");
  });
});

describe("buildRushQuestions", () => {
  it("每對一題、候選含正確答案與 2 個干擾，且不修改原 set", () => {
    const set = MATCHING_SETS.find((s) => s.id === "m-math-1");
    expect(set).toBeTruthy();
    const questions = buildRushQuestions(set as MatchingSet, seeded(5));
    expect(questions).toHaveLength((set as MatchingSet).pairs.length);
    const otherRights = new Set((set as MatchingSet).pairs.map((p) => p.r));
    (set as MatchingSet).distractors.forEach((d) => otherRights.add(d));
    for (const q of questions) {
      expect(q.options).toHaveLength(3);
      expect(q.options).toContain(q.answer);
      for (const opt of q.options) {
        expect(otherRights.has(opt)).toBe(true);
      }
      expect(new Set(q.options).size).toBe(3);
    }
    expect((set as MatchingSet).pairs).toHaveLength(6);
  });

  it("迷你盤（4 對＋1 干擾）也能產生 3 選（干擾不足時少給仍含答案）", () => {
    const base = MATCHING_SETS.find((s) => s.id === "m-math-1");
    const mini = sliceMatchingSet(base as MatchingSet, 4, 1, seeded(7));
    const questions = buildRushQuestions(mini, seeded(8));
    expect(questions).toHaveLength(4);
    for (const q of questions) {
      expect(q.options).toContain(q.answer);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("G 圖片配對題庫", () => {
  it("IMAGE_MATCHING_SETS 共 3 組，每組 6 對且每對帶 img", () => {
    expect(IMAGE_MATCHING_SETS).toHaveLength(3);
    for (const set of IMAGE_MATCHING_SETS) {
      expect(set.pairs).toHaveLength(6);
      for (const pair of set.pairs) {
        expect(typeof pair.img).toBe("string");
        expect(pair.img).toMatch(/^\/matching-img\//);
      }
    }
  });

  it("圖片組也會被抽進速配題，且帶 img 欄位", () => {
    const imageSet = IMAGE_MATCHING_SETS[0];
    const questions = buildRushQuestions(imageSet, seeded(3));
    expect(questions).toHaveLength(6);
    for (const q of questions) {
      expect(typeof q.img).toBe("string");
      expect(q.options).toContain(q.answer);
    }
  });
});
