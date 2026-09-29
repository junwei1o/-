import { describe, expect, it } from "vitest";
import {
  clearTriAxisProgress,
  formatElapsedMmSs,
  loadTriAxisProgress,
  saveTriAxisProgress,
  TRI_AXIS_PROGRESS_KEY,
  type TriAxisProgress,
} from "./triAxisProgress";

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

const base: Omit<TriAxisProgress, "version" | "updatedAt"> = {
  seed: 12345,
  index: 3,
  answers: { q1: { picked: 2, answeredAt: 1000 } },
  startedAt: 500,
  deckIds: ["q1", "q2", "q3", "q4"],
};

describe("三軸作答進度存取", () => {
  it("存入後可完整讀回", () => {
    const storage = memoryStorage();
    saveTriAxisProgress(base, storage);
    const loaded = loadTriAxisProgress(storage);
    expect(loaded?.seed).toBe(12345);
    expect(loaded?.index).toBe(3);
    expect(loaded?.answers.q1.picked).toBe(2);
    expect(loaded?.startedAt).toBe(500);
    expect(loaded?.deckIds).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("空 storage 回 null", () => {
    expect(loadTriAxisProgress(memoryStorage())).toBeNull();
  });

  it("損壞資料回 null 並清除", () => {
    const storage = memoryStorage();
    storage.setItem(TRI_AXIS_PROGRESS_KEY, "{壞掉的");
    expect(loadTriAxisProgress(storage)).toBeNull();
    expect(storage.getItem(TRI_AXIS_PROGRESS_KEY)).toBeNull();
  });

  it("版本不符回 null", () => {
    const storage = memoryStorage();
    storage.setItem(TRI_AXIS_PROGRESS_KEY, JSON.stringify({ ...base, version: 99 }));
    expect(loadTriAxisProgress(storage)).toBeNull();
  });

  it("清除後讀不到", () => {
    const storage = memoryStorage();
    saveTriAxisProgress(base, storage);
    clearTriAxisProgress(storage);
    expect(loadTriAxisProgress(storage)).toBeNull();
  });
});

describe("試卷時間 mm:ss", () => {
  it("不足一分鐘補零", () => {
    expect(formatElapsedMmSs(5_000)).toBe("00:05");
    expect(formatElapsedMmSs(59_000)).toBe("00:59");
  });

  it("超過一分鐘正常進位", () => {
    expect(formatElapsedMmSs(65_000)).toBe("01:05");
    expect(formatElapsedMmSs(600_000)).toBe("10:00");
  });

  it("負值與零歸零", () => {
    expect(formatElapsedMmSs(-100)).toBe("00:00");
    expect(formatElapsedMmSs(0)).toBe("00:00");
  });
});
