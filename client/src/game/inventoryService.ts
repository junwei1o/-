export const INVENTORY_STORAGE_KEY = "xue-adventure-specialty-inventory-v1";
export const INVENTORY_CAPACITY = 24;

export type InventorySource = "battle-victory" | "correct-answer-milestone" | "map-easter-egg" | "battle-potion-drop";

export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  category: "台灣特產" | "戰鬥道具";
  acquiredAt: number;
  source: InventorySource;
  effect?: { type: "heal"; amount: number };
};

export type SpecialtyDropInput = {
  source: InventorySource;
  awardId: string;
  acquiredAt?: number;
};

type SpecialtyDefinition = Pick<InventoryItem, "name" | "emoji" | "category"> & { key: string };

type InventoryState = {
  version: 1;
  items: InventoryItem[];
  awardedIds: string[];
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;
type InventoryStorage = StorageReader & StorageWriter;

export const TAIWAN_SPECIALTIES: SpecialtyDefinition[] = [
  { key: "bubble-tea", name: "珍珠奶茶", emoji: "🧋", category: "台灣特產" },
  { key: "pineapple-cake", name: "鳳梨酥", emoji: "🍍", category: "台灣特產" },
  { key: "oolong-tea", name: "烏龍茶", emoji: "🍵", category: "台灣特產" },
  { key: "braised-pork-rice", name: "滷肉飯", emoji: "🍚", category: "台灣特產" },
  { key: "mango-shaved-ice", name: "芒果冰", emoji: "🍧", category: "台灣特產" },
  { key: "iron-egg", name: "鐵蛋", emoji: "🥚", category: "台灣特產" },
  { key: "sun-cake", name: "太陽餅", emoji: "☀️", category: "台灣特產" },
];

const emptyInventoryState = (): InventoryState => ({ version: 1, items: [], awardedIds: [] });

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<InventoryItem>;
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.emoji === "string"
    && (item.category === "台灣特產" || item.category === "戰鬥道具")
    && typeof item.acquiredAt === "number"
    && (item.source === "battle-victory" || item.source === "correct-answer-milestone" || item.source === "map-easter-egg" || item.source === "battle-potion-drop");
}

function inventoryStorage(storage?: InventoryStorage): InventoryStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeInventoryState(value: unknown): InventoryState {
  if (!value || typeof value !== "object") return emptyInventoryState();
  const state = value as Partial<InventoryState>;
  if (state.version !== 1 || !Array.isArray(state.items) || !Array.isArray(state.awardedIds)) return emptyInventoryState();

  const uniqueItems = state.items
    .filter(isInventoryItem)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => right.acquiredAt - left.acquiredAt)
    .slice(0, INVENTORY_CAPACITY);
  const awardedIds = state.awardedIds.filter((awardId): awardId is string => typeof awardId === "string").slice(-80);

  return { version: 1, items: uniqueItems, awardedIds: Array.from(new Set(awardedIds)) };
}

export function getInventory(storage?: InventoryStorage): InventoryItem[] {
  const target = inventoryStorage(storage);
  if (!target) return [];
  try {
    const raw = target.getItem(INVENTORY_STORAGE_KEY);
    return raw ? normalizeInventoryState(JSON.parse(raw)).items : [];
  } catch {
    return [];
  }
}

export function saveInventoryItem(item: InventoryItem, storage?: InventoryStorage): InventoryItem[] {
  const target = inventoryStorage(storage);
  if (!target || !isInventoryItem(item)) return getInventory(storage);

  try {
    const raw = target.getItem(INVENTORY_STORAGE_KEY);
    const current = raw ? normalizeInventoryState(JSON.parse(raw)) : emptyInventoryState();
    const nextItems = [item, ...current.items.filter((candidate) => candidate.id !== item.id)]
      .sort((left, right) => right.acquiredAt - left.acquiredAt)
      .slice(0, INVENTORY_CAPACITY);
    target.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({ ...current, items: nextItems } satisfies InventoryState));
    return nextItems;
  } catch {
    return getInventory(storage);
  }
}

/**
 * 由已驗證的完成事件呼叫。awardId 是去重憑據，讓重新整理或重放事件不會重複發放。
 * 隨機函式可注入測試；產品環境使用瀏覽器的亂數來源。
 */
export function tryDropSpecialty(input: SpecialtyDropInput, storage?: InventoryStorage, random: () => number = Math.random): InventoryItem | null {
  const target = inventoryStorage(storage);
  if (!target || !input.awardId || !TAIWAN_SPECIALTIES.length) return null;

  try {
    const raw = target.getItem(INVENTORY_STORAGE_KEY);
    const current = raw ? normalizeInventoryState(JSON.parse(raw)) : emptyInventoryState();
    if (current.awardedIds.includes(input.awardId) || current.items.length >= INVENTORY_CAPACITY) return null;

    const index = Math.min(TAIWAN_SPECIALTIES.length - 1, Math.max(0, Math.floor(random() * TAIWAN_SPECIALTIES.length)));
    const specialty = TAIWAN_SPECIALTIES[index];
    const item: InventoryItem = {
      id: `${specialty.key}-${input.awardId}`,
      name: specialty.name,
      emoji: specialty.emoji,
      category: specialty.category,
      acquiredAt: input.acquiredAt ?? Date.now(),
      source: input.source,
    };
    const next: InventoryState = {
      version: 1,
      items: [item, ...current.items].slice(0, INVENTORY_CAPACITY),
      awardedIds: [...current.awardedIds, input.awardId].slice(-80),
    };
    target.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(next));
    return item;
  } catch {
    return null;
  }
}


export const HEALTH_POTION_ID = "health-potion";
export const HEALTH_POTION_HEAL = 35;

export function countHealthPotions(storage?: InventoryStorage): number {
  return getInventory(storage).filter((item) => item.id.startsWith(`${HEALTH_POTION_ID}-`)).length;
}

export function tryDropHealthPotion(answerCount: number, storage?: InventoryStorage, random: () => number = Math.random): InventoryItem | null {
  const target = inventoryStorage(storage);
  if (!target || answerCount < 5 || random() >= 0.35) return null;
  try {
    const raw = target.getItem(INVENTORY_STORAGE_KEY);
    const current = raw ? normalizeInventoryState(JSON.parse(raw)) : emptyInventoryState();
    if (current.items.length >= INVENTORY_CAPACITY) return null;
    const item: InventoryItem = {
      id: `${HEALTH_POTION_ID}-${Date.now()}-${answerCount}`,
      name: "補血藥水",
      emoji: "🧪",
      category: "戰鬥道具",
      acquiredAt: Date.now(),
      source: "battle-potion-drop",
      effect: { type: "heal", amount: HEALTH_POTION_HEAL },
    };
    target.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({ ...current, items: [item, ...current.items].slice(0, INVENTORY_CAPACITY) } satisfies InventoryState));
    return item;
  } catch { return null; }
}

export function consumeHealthPotion(storage?: InventoryStorage): InventoryItem | null {
  const target = inventoryStorage(storage);
  if (!target) return null;
  try {
    const raw = target.getItem(INVENTORY_STORAGE_KEY);
    const current = raw ? normalizeInventoryState(JSON.parse(raw)) : emptyInventoryState();
    const index = current.items.findIndex((item) => item.id.startsWith(`${HEALTH_POTION_ID}-`));
    if (index < 0) return null;
    const [item] = current.items.splice(index, 1);
    target.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(current satisfies InventoryState));
    return item;
  } catch { return null; }
}
