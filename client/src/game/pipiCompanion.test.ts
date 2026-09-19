import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PIPI_COSTUMES,
  PIPI_QUEST_POOL,
  claimPipiQuest,
  claimableQuests,
  costumeById,
  getTodayQuests,
  isCostumeUnlocked,
  loadQuestState,
  loadWornCostumes,
  recordPipiEvent,
  saveWornCostumes,
  selectDailyQuests,
  todayKey,
  unlockedCostumeIds,
  type PipiQuestState,
} from "./pipiCompanion";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => { map.delete(k); },
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
}

describe("selectDailyQuests", () => {
  it("同一天永遠選出同一組 3 個任務", () => {
    const a = selectDailyQuests("2026-09-18");
    const b = selectDailyQuests("2026-09-18");
    expect(a).toHaveLength(3);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it("不同日子可能選出不同組合，且都在任務池內", () => {
    const a = selectDailyQuests("2026-09-18");
    for (const q of a) expect(PIPI_QUEST_POOL.some((p) => p.id === q.id)).toBe(true);
    for (let d = 1; d <= 30; d++) {
      const day = `2026-09-${String(d).padStart(2, "0")}`;
      expect(selectDailyQuests(day)).toHaveLength(3);
    }
  });
});

describe("任務進度", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recordPipiEvent 推進進度並在達標時回報完成", () => {
    const quest = PIPI_QUEST_POOL.find((q) => q.id === "map1")!;
    // 讓 map1 一定在今日任務裡：直接寫入狀態
    const forced: PipiQuestState = {
      date: todayKey(),
      questIds: ["map1", "weekly1", "answer10"],
      progress: {},
      claimed: [],
      claimedTotal: 0,
    };
    storage.setItem("pipi-quests-v1", JSON.stringify(forced));
    const r1 = recordPipiEvent("map-visit", 1, storage);
    expect(r1.completed.map((q) => q.id)).toEqual([quest.id]);
    const r2 = recordPipiEvent("map-visit", 1, storage);
    expect(r2.completed).toHaveLength(0); // 已達標不再重複完成
    expect(loadQuestState(storage).progress["map1"]).toBe(1);
  });

  it("超過目標的進度不溢位", () => {
    const forced: PipiQuestState = {
      date: todayKey(),
      questIds: ["answer5", "game1", "map3"],
      progress: {},
      claimed: [],
      claimedTotal: 0,
    };
    storage.setItem("pipi-quests-v1", JSON.stringify(forced));
    recordPipiEvent("answer-correct", 99, storage);
    expect(loadQuestState(storage).progress["answer5"]).toBe(5);
  });

  it("跨日重置：舊日期狀態會換新", () => {
    storage.setItem("pipi-quests-v1", JSON.stringify({
      date: "2000-01-01",
      questIds: ["map1", "map3", "weekly1"],
      progress: { map1: 1 },
      claimed: ["map1"],
      claimedTotal: 5,
    }));
    const state = loadQuestState(storage);
    expect(state.date).toBe(todayKey());
    expect(state.progress).toEqual({});
    expect(state.claimed).toEqual([]);
    expect(state.claimedTotal).toBe(0);
  });

  it("claimPipiQuest 只能領一次，且累計 claimedTotal", () => {
    const forced: PipiQuestState = {
      date: todayKey(),
      questIds: ["game1", "map1", "weekly1"],
      progress: { game1: 1 },
      claimed: [],
      claimedTotal: 0,
    };
    storage.setItem("pipi-quests-v1", JSON.stringify(forced));
    const reward = claimPipiQuest("game1", storage);
    expect(reward).toEqual({ questId: "game1", rewardCoins: 10, rewardAffection: 8 });
    expect(claimPipiQuest("game1", storage)).toBeNull();
    expect(loadQuestState(storage).claimedTotal).toBe(1);
    expect(claimPipiQuest("map1", storage)).toBeNull(); // 進度未達標
  });

  it("claimableQuests 只回傳已達標未領取的任務", () => {
    const forced: PipiQuestState = {
      date: todayKey(),
      questIds: ["game1", "map1", "weekly1"],
      progress: { game1: 1, map1: 0, weekly1: 1 },
      claimed: ["weekly1"],
      claimedTotal: 1,
    };
    expect(claimableQuests(forced).map((q) => q.id)).toEqual(["game1"]);
  });
});

describe("套裝衣櫥", () => {
  it("依好感度／互動次數／任務數解鎖", () => {
    expect(isCostumeUnlocked(costumeById("grad-hat")!, { affection: 50, count: 0, questsClaimed: 0 })).toBe(true);
    expect(isCostumeUnlocked(costumeById("grad-hat")!, { affection: 49, count: 0, questsClaimed: 0 })).toBe(false);
    expect(isCostumeUnlocked(costumeById("sunglasses")!, { affection: 0, count: 40, questsClaimed: 0 })).toBe(true);
    expect(isCostumeUnlocked(costumeById("telescope")!, { affection: 0, count: 0, questsClaimed: 3 })).toBe(true);
  });

  it("unlockedCostumeIds 回傳全部已解鎖套裝", () => {
    const ids = unlockedCostumeIds({ affection: 300, count: 50, questsClaimed: 10 });
    expect(ids).toHaveLength(PIPI_COSTUMES.length);
  });

  it("穿搭存取會過濾非法 id", () => {
    const s = mockStorage();
    saveWornCostumes(["grad-hat", "not-exist"], s);
    expect(loadWornCostumes(s)).toEqual(["grad-hat"]);
    expect(loadWornCostumes(mockStorage())).toEqual([]);
  });
});
