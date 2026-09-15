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

  it("教學三步驟文案完整（技能→答題→傷害結算）", () => {
    expect(BATTLE_TUTORIAL_STEPS.map((step) => step.key)).toEqual(["act", "answer", "damage"]);
    expect(BATTLE_TUTORIAL_STEPS[0].title).toContain("選擇");
    expect(BATTLE_TUTORIAL_STEPS[1].title).toContain("作答");
    expect(BATTLE_TUTORIAL_STEPS[2].title).toContain("傷害結算");
  });
});
