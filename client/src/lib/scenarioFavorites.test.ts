import { describe, expect, it } from "vitest";
import { loadScenarioFavorites, saveScenarioFavorites, SCENARIO_FAVORITES_STORAGE_KEY } from "./scenarioFavorites";

describe("情境卡收藏保存", () => {
  it("只恢復版本正確且有效的唯一題目識別，並限制保存數量", () => {
    const storage = { getItem: () => JSON.stringify({ version: 1, questionIds: ["a", "a", "", 3, ...Array.from({ length: 45 }, (_, index) => `q-${index}`)] }), removeItem: () => undefined };
    expect(loadScenarioFavorites(storage)).toEqual(["a", ...Array.from({ length: 39 }, (_, index) => `q-${index}`)]);
  });

  it("損壞或不相容資料會清除並回退為空收藏", () => {
    let removed = false;
    const storage = { getItem: () => "{broken", removeItem: () => { removed = true; } };
    expect(loadScenarioFavorites(storage)).toEqual([]);
    expect(removed).toBe(true);
  });

  it("保存時採版本化資料格式並去除重複識別", () => {
    let stored = "";
    saveScenarioFavorites(["gravity", "gravity", "light"], { setItem: (key, value) => { expect(key).toBe(SCENARIO_FAVORITES_STORAGE_KEY); stored = value; } });
    expect(JSON.parse(stored)).toEqual({ version: 1, questionIds: ["gravity", "light"] });
  });
});
