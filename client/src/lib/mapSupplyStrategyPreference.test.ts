import { describe, expect, it } from "vitest";
import {
  LEGACY_MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY,
  loadMapSupplyStrategyPreference,
  MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY,
  preferenceForIsland,
  saveMapSupplyStrategyPreference,
} from "@/lib/mapSupplyStrategyPreference";

type MemoryStorage = Storage & { store: Map<string, string> };

function createStorage(): MemoryStorage {
  const store = new Map<string, string>();
  return {
    store,
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => { store.set(key, value); },
  };
}

describe("mapSupplyStrategyPreference", () => {
  it("persists expanded or collapsed choices independently by island", () => {
    const storage = createStorage();
    expect(loadMapSupplyStrategyPreference(storage)).toEqual({ version: 2, expandedByIsland: {} });

    saveMapSupplyStrategyPreference("math", true, storage);
    saveMapSupplyStrategyPreference("science", false, storage);
    const preference = loadMapSupplyStrategyPreference(storage);

    expect(preference).toEqual({ version: 2, expandedByIsland: { math: true, science: false } });
    expect(preferenceForIsland(preference, "math")).toBe(true);
    expect(preferenceForIsland(preference, "science")).toBe(false);
    expect(preferenceForIsland(preference, "language")).toBe(false);
    expect(storage.getItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY)).toContain('"math":true');
  });

  it("migrates the legacy single preference as a fallback for islands not yet visited", () => {
    const storage = createStorage();
    storage.setItem(LEGACY_MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY, JSON.stringify({ version: 1, expanded: true }));

    const preference = loadMapSupplyStrategyPreference(storage);
    expect(preference).toEqual({ version: 2, expandedByIsland: {}, legacyExpanded: true });
    expect(preferenceForIsland(preference, "math")).toBe(true);
    expect(storage.getItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY)).toContain('"legacyExpanded":true');
  });

  it("clears invalid stored data and safely falls back", () => {
    const storage = createStorage();
    storage.setItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY, JSON.stringify({ version: 9, expanded: true }));

    expect(loadMapSupplyStrategyPreference(storage)).toEqual({ version: 2, expandedByIsland: {} });
    expect(storage.getItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when storage operations fail", () => {
    const failingStorage = {
      getItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };

    expect(loadMapSupplyStrategyPreference(failingStorage)).toEqual({ version: 2, expandedByIsland: {} });
    expect(saveMapSupplyStrategyPreference("math", true, failingStorage)).toEqual({ version: 2, expandedByIsland: { math: true } });
  });
});
