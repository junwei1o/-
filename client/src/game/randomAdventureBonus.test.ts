import { beforeEach, describe, expect, it } from "vitest";
import { loadRpgState } from "./rpgStorage";
import { claimRandomAdventureBonus } from "./randomAdventureBonus";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  } as Storage;
}

describe("隨機冒險雙倍金幣", () => {
  let storage: Storage;

  beforeEach(() => { storage = createMemoryStorage(); });

  it("只在已驗證答對後加發與一般獎勵等額的金幣", () => {
    const before = loadRpgState(storage);
    const result = claimRandomAdventureBonus({ eventId: "random-q-1", correct: true, bonusCoins: 7 }, storage);

    expect(result.awarded).toBe(7);
    expect(loadRpgState(storage).coins).toBe(before.coins + 7);
  });

  it("以事件憑據阻止重新整理或重複點擊重複加發", () => {
    claimRandomAdventureBonus({ eventId: "random-q-2", correct: true, bonusCoins: 5 }, storage);
    const afterFirstClaim = loadRpgState(storage).coins;
    const duplicate = claimRandomAdventureBonus({ eventId: "random-q-2", correct: true, bonusCoins: 5 }, storage);

    expect(duplicate.awarded).toBe(0);
    expect(loadRpgState(storage).coins).toBe(afterFirstClaim);
  });

  it("答錯、缺少事件憑據或無效金額都不會發放獎勵", () => {
    const before = loadRpgState(storage).coins;
    expect(claimRandomAdventureBonus({ eventId: "random-q-3", correct: false, bonusCoins: 4 }, storage).awarded).toBe(0);
    expect(claimRandomAdventureBonus({ eventId: "", correct: true, bonusCoins: 4 }, storage).awarded).toBe(0);
    expect(claimRandomAdventureBonus({ eventId: "random-q-4", correct: true, bonusCoins: 0 }, storage).awarded).toBe(0);
    expect(loadRpgState(storage).coins).toBe(before);
  });
});
