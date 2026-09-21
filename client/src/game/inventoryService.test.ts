import { describe, expect, it } from "vitest";
import { getInventory, INVENTORY_CAPACITY, INVENTORY_STORAGE_KEY, saveInventoryItem, tryDropSpecialty } from "./inventoryService";

function createStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  };
}

describe("inventoryService", () => {
  it("只會為同一個已驗證事件發放一次特產", () => {
    const storage = createStorage();
    const first = tryDropSpecialty({ source: "correct-answer-milestone", awardId: "answer-1", acquiredAt: 1 }, storage, () => 0);
    const repeated = tryDropSpecialty({ source: "correct-answer-milestone", awardId: "answer-1", acquiredAt: 2 }, storage, () => 0.5);

    expect(first?.name).toBe("珍珠奶茶");
    expect(repeated).toBeNull();
    expect(getInventory(storage)).toHaveLength(1);
  });

  it("保留有限、最新優先的背包內容", () => {
    const storage = createStorage();
    for (let index = 0; index < INVENTORY_CAPACITY + 3; index += 1) {
      saveInventoryItem({ id: `item-${index}`, name: `特產${index}`, emoji: "✦", category: "台灣特產", acquiredAt: index, source: "map-easter-egg" }, storage);
    }

    const inventory = getInventory(storage);
    expect(inventory).toHaveLength(INVENTORY_CAPACITY);
    expect(inventory[0]?.id).toBe(`item-${INVENTORY_CAPACITY + 2}`);
  });

  it("遇到無效本機資料時安全回傳空背包", () => {
    const storage = createStorage();
    storage.setItem(INVENTORY_STORAGE_KEY, "not-json");
    expect(getInventory(storage)).toEqual([]);
  });
});
