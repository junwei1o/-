import { describe, expect, it } from "vitest";
import { KNOWLEDGE_DUEL_RECORDS_KEY, getKnowledgeDuelRecords, saveKnowledgeDuelRecord } from "./storage";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("knowledge duel storage", () => {
  it("stores only valid local match records and replaces matching ids", () => {
    const storage = createStorage();
    const first = saveKnowledgeDuelRecord({ id: "duel-1", timestamp: 1, winner: "player", playerWins: 2, aiWins: 1, weakSubjects: ["數學"], usedCards: ["shield"] }, storage);
    expect(first).toHaveLength(1);

    const replaced = saveKnowledgeDuelRecord({ id: "duel-1", timestamp: 2, winner: "ai", playerWins: 1, aiWins: 2, weakSubjects: ["國文"], usedCards: ["insight"] }, storage);
    expect(replaced).toEqual([expect.objectContaining({ timestamp: 2, winner: "ai" })]);
    expect(JSON.parse(storage.getItem(KNOWLEDGE_DUEL_RECORDS_KEY) ?? "[]")).toHaveLength(1);
  });

  it("returns an empty collection for malformed persisted data", () => {
    const storage = createStorage();
    storage.setItem(KNOWLEDGE_DUEL_RECORDS_KEY, JSON.stringify([{ id: 3 }]));
    expect(getKnowledgeDuelRecords(storage)).toEqual([]);
  });
});
