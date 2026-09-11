/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALL_CARDS } from "./trumpCardData";
import {
  CARD_PACK_GOLD_COST,
  STARTER_KEY,
  greetKeeper,
  grantStarterCards,
  nextTavernGoal,
  type KeeperContext,
} from "./tavernKeeper";

const baseCtx: KeeperContext = {
  hour: 9,
  totalAnswers: 0,
  streak: 0,
  ownedCardCount: 0,
  uncompletedChapters: 0,
};

describe("tavernKeeper - greetKeeper", () => {
  it("依時段回傳招呼句", () => {
    expect(greetKeeper({ ...baseCtx, hour: 6 })).toContain("早安");
    expect(greetKeeper({ ...baseCtx, hour: 13 })).toContain("午後");
    expect(greetKeeper({ ...baseCtx, hour: 19 })).toContain("夜色深了");
    expect(greetKeeper({ ...baseCtx, hour: 1 })).toContain("夜深了");
  });

  it("連勝 ≥5 追加好手氣句", () => {
    const msg = greetKeeper({ ...baseCtx, streak: 5 });
    expect(msg).toContain("好手氣");
  });

  it("收藏 ≥15 追加蒐集句", () => {
    const msg = greetKeeper({ ...baseCtx, ownedCardCount: 15 });
    expect(msg).toContain("蒐集");
  });

  it("有未解章節追加佈告欄句", () => {
    const msg = greetKeeper({ ...baseCtx, uncompletedChapters: 2 });
    expect(msg).toContain("佈告欄");
  });

  it("無狀態時不追加額外句", () => {
    const msg = greetKeeper(baseCtx);
    expect(msg).not.toContain("好手氣");
    expect(msg).not.toContain("佈告欄");
  });
});

describe("tavernKeeper - grantStarterCards", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("首次回傳恰好 5 張卡 id", () => {
    const picks = grantStarterCards(() => 0.5);
    expect(picks).not.toBeNull();
    expect(picks!.length).toBe(5);
  });

  it("全部為普通卡且 id 存在", () => {
    const picks = grantStarterCards(() => 0.3)!;
    for (const id of picks) {
      const card = ALL_CARDS.find((c) => c.id === id);
      expect(card).toBeTruthy();
      expect(card!.rarity).toBe("common");
    }
  });

  it("回傳的 5 張不重複", () => {
    const picks = grantStarterCards(() => 0.7)!;
    expect(new Set(picks).size).toBe(5);
  });

  it("贈卡後寫入一次性標記，再次呼叫回傳 null", () => {
    expect(grantStarterCards(() => 0.4)).not.toBeNull();
    expect(localStorage.getItem(STARTER_KEY)).toBe("1");
    expect(grantStarterCards(() => 0.4)).toBeNull();
  });
});

describe("tavernKeeper - 常數", () => {
  it("CARD_PACK_GOLD_COST 為 25", () => {
    expect(CARD_PACK_GOLD_COST).toBe(25);
  });

  it("STARTER_KEY 採用 xue- 慣例", () => {
    expect(STARTER_KEY).toMatch(/^xue-/);
  });
});

describe("tavernKeeper - nextTavernGoal", () => {
  it("未簽到時優先提示簽到，並帶出可領金幣", () => {
    const goal = nextTavernGoal({ gold: 100, signedInToday: false, signInReward: 8, uncompletedChapters: 2 });
    expect(goal.key).toBe("signin");
    expect(goal.text).toContain("8");
  });

  it("已簽到且金幣足夠時提示開卡包", () => {
    const goal = nextTavernGoal({ gold: 30, signedInToday: true, signInReward: 8, uncompletedChapters: 2 });
    expect(goal.key).toBe("pack");
    expect(goal.text).toContain(String(CARD_PACK_GOLD_COST));
  });

  it("金幣不足且有未解章節時提示佈告欄與金幣差距", () => {
    const goal = nextTavernGoal({ gold: 10, signedInToday: true, signInReward: 8, uncompletedChapters: 1 });
    expect(goal.key).toBe("adventure");
    expect(goal.text).toContain("15");
  });

  it("金幣不足且無未解章節時提示賺金幣", () => {
    const goal = nextTavernGoal({ gold: 0, signedInToday: true, signInReward: 8, uncompletedChapters: 0 });
    expect(goal.key).toBe("study");
    expect(goal.text).toContain(String(CARD_PACK_GOLD_COST));
  });

  it("金幣剛好等於售價視為可購買", () => {
    const goal = nextTavernGoal({
      gold: CARD_PACK_GOLD_COST,
      signedInToday: true,
      signInReward: 8,
      uncompletedChapters: 0,
    });
    expect(goal.key).toBe("pack");
  });
});
