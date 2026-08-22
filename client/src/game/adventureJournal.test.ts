import { describe, expect, it } from "vitest";
import { ADVENTURE_JOURNAL_CAPACITY, ADVENTURE_JOURNAL_STORAGE_KEY, formatJournalSummary, getJournalEntries, saveJournalEntry, type JournalEntry } from "./adventureJournal";

function createStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  };
}

function entry(index: number): JournalEntry {
  const base = { id: `entry-${index}`, date: index, subject: "數學", topicCount: 1, correctCount: index + 1, sessionType: "exam" as const, islandId: "math" };
  return { ...base, summary: formatJournalSummary(base) };
}

describe("adventureJournal", () => {
  it("以最新優先保存真實結算紀錄並依 id 去重", () => {
    const storage = createStorage();
    saveJournalEntry(entry(1), storage);
    saveJournalEntry(entry(3), storage);
    saveJournalEntry({ ...entry(1), date: 4 }, storage);

    expect(getJournalEntries(storage).map((item) => item.id)).toEqual(["entry-1", "entry-3"]);
  });

  it("容量上限為最近 30 筆", () => {
    const storage = createStorage();
    for (let index = 0; index < ADVENTURE_JOURNAL_CAPACITY + 2; index += 1) saveJournalEntry(entry(index), storage);
    expect(getJournalEntries(storage)).toHaveLength(ADVENTURE_JOURNAL_CAPACITY);
    expect(getJournalEntries(storage)[0]?.id).toBe(`entry-${ADVENTURE_JOURNAL_CAPACITY + 1}`);
  });

  it("依可驗證欄位產生正向日誌文案，且無效資料安全降級", () => {
    const storage = createStorage();
    storage.setItem(ADVENTURE_JOURNAL_STORAGE_KEY, "bad-json");
    expect(formatJournalSummary({ subject: "自然", topicCount: 2, correctCount: 4, sessionType: "battle", randomAdventure: undefined })).toContain("完成了 4 道自然題");
    expect(getJournalEntries(storage)).toEqual([]);
  });

  it("保存隨機冒險的真實知識點與金幣獎勵", () => {
    const storage = createStorage();
    const base = {
      id: "random-adventure-event-1",
      date: 20,
      subject: "數學",
      topicCount: 1,
      correctCount: 1,
      sessionType: "exam" as const,
      islandId: null,
      randomAdventure: {
        questionId: "question-1",
        knowledgePoint: "一元一次方程式",
        baseCoins: 10,
        bonusCoins: 10,
        totalCoins: 20,
      },
    };
    saveJournalEntry({ ...base, summary: formatJournalSummary(base) }, storage);
    const [saved] = getJournalEntries(storage);
    expect(saved?.randomAdventure).toEqual(base.randomAdventure);
    expect(saved?.summary).toContain("學到了「一元一次方程式」");
    expect(saved?.summary).toContain("獲得 20 枚航海金幣");
    expect(saved?.summary).toContain("隨機冒險加碼 10 枚");
  });
});
