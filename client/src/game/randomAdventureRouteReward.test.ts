import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRandomAdventureRouteReward,
  queueRandomAdventureRouteReward,
  RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY,
} from "@/game/randomAdventureRouteReward";

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

describe("randomAdventureRouteReward", () => {
  let storage: Storage;

  beforeEach(() => { storage = createMemoryStorage(); });

  it("consumes a verified completion once so a refresh cannot replay the map feedback", () => {
    expect(queueRandomAdventureRouteReward({ eventId: "random-1", questionId: "q-1", subject: "數學", completedAt: 1_700_000_000_000 }, storage)).toBe(true);
    expect(consumeRandomAdventureRouteReward(storage)).toEqual({ eventId: "random-1", questionId: "q-1", subject: "數學", completedAt: 1_700_000_000_000 });
    expect(consumeRandomAdventureRouteReward(storage)).toBeNull();
  });

  it("safely rejects incomplete local data", () => {
    storage.setItem(RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY, JSON.stringify({ eventId: "random-1" }));
    expect(consumeRandomAdventureRouteReward(storage)).toBeNull();
  });
});
