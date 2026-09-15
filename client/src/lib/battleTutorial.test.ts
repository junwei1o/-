// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  BATTLE_TUTORIAL_STEPS,
  BATTLE_TUTORIAL_STORAGE_KEY,
  loadBattleTutorial,
  markBattleTutorialSeen,
  resetBattleTutorial,
} from "./battleTutorial";

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

describe("battleTutorial", () => {
  it("初始為未看過（seen=false）", () => {
    const storage = memoryStorage();
    expect(loadBattleTutorial(storage).seen).toBe(false);
  });

  it("標記看過後持久化，重載仍為 seen=true", () => {
    const storage = memoryStorage();
    markBattleTutorialSeen(storage);
    expect(loadBattleTutorial(storage).seen).toBe(true);
    expect(loadBattleTutorial(storage).version).toBe(1);
  });

  it("壞資料會被清除並回到預設", () => {
    const storage = memoryStorage();
    storage.setItem(BATTLE_TUTORIAL_STORAGE_KEY, "{broken json");
    expect(loadBattleTutorial(storage).seen).toBe(false);
    expect(storage.getItem(BATTLE_TUTORIAL_STORAGE_KEY)).toBeNull();
  });

  it("重置後回到未看過", () => {
    const storage = memoryStorage();
    markBattleTutorialSeen(storage);
    resetBattleTutorial(storage);
    expect(loadBattleTutorial(storage).seen).toBe(false);
  });

  it("教學四步驟文案完整（基礎攻擊→答題能量→連擊怒氣→回合日誌）", () => {
    expect(BATTLE_TUTORIAL_STEPS.map((step) => step.key)).toEqual(["basic", "energy", "rage", "flow"]);
    expect(BATTLE_TUTORIAL_STEPS[0].title).toContain("基礎攻擊");
    expect(BATTLE_TUTORIAL_STEPS[1].title).toContain("能量");
    expect(BATTLE_TUTORIAL_STEPS[2].title).toContain("怒氣");
    expect(BATTLE_TUTORIAL_STEPS[3].title).toContain("回合");
    // 每步都要有實質說明文字。
    for (const step of BATTLE_TUTORIAL_STEPS) expect(step.text.length).toBeGreaterThan(10);
  });
});
