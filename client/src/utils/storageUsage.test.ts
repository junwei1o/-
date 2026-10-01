// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getStorageUsageSummary, utf8ByteLength } from "./storage";

/**
 * 2026-10-01：`getStorageUsageSummary` 原本每個 key 做兩次 `new Blob([...])`
 * 來算位元組數，改為純算術 `utf8ByteLength`。
 *
 * 「使用者可見的已使用量數字」不能因為這次重構而變動，因此這裡用
 * `new Blob([s]).size` 當**參考實作**逐字比對——覆蓋 ASCII、CJK（3 位元組）、
 * 代理對（emoji，4 位元組）與混合字串。
 */
describe("utf8ByteLength：與 new Blob([...]).size 等價", () => {
  const samples = [
    "",
    "a",
    "hello world",
    "中",
    "光合作用需要陽光、水和二氧化碳",
    "😀", // U+1F600：代理對，4 位元組
    "🎉🎊👋", // 連續代理對
    "中a😀1", // 混合
    "𠮷", // U+20BB7，代理對
    "\u0000\u001f\u007f", // 控制字元
    "ﬁ", // U+FB01，3 位元組
    "ｱ", // U+FF71 半形片假名，3 位元組
    "é", // U+00E9，2 位元組
    "Ā", // U+0100，2 位元組
  ];

  it("每個樣本都與參考實作一致", () => {
    for (const sample of samples) {
      expect(utf8ByteLength(sample), `樣本：${JSON.stringify(sample)}`).toBe(new Blob([sample]).size);
    }
  });

  it("長字串（模擬真實學習紀錄）也一致", () => {
    const long = JSON.stringify(
      Array.from({ length: 200 }, (_, index) => ({
        questionId: `q${index}`,
        subject: "數學",
        isCorrect: index % 3 === 0,
        timestamp: 1790000000000 + index,
      })),
    );
    expect(utf8ByteLength(long)).toBe(new Blob([long]).size);
  });
});

/** 可列舉的最小 Storage stub（比照真實 localStorage 的 length/key/getItem 介面）。 */
function makeStorage(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (index: number) => keys[index] ?? null,
    getItem: (key: string) => (key in entries ? entries[key] : null),
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

describe("getStorageUsageSummary：改用純算術後數字不變", () => {
  it("usedBytes 與 Blob 參考實作完全相同", () => {
    const entries = {
      "xue-session-v1": JSON.stringify({ name: "小探險家", role: "student" }),
      xueLearningRecord: JSON.stringify([{ q: "中", ok: true }, { q: "😀", ok: false }]),
      bx_state_v1: JSON.stringify({ onboarding: { completed: true } }),
      "xue.sound.enabled": "true",
      empty: "",
    };
    const summary = getStorageUsageSummary(makeStorage(entries));
    const expected = Object.entries(entries).reduce(
      (total, [key, value]) => total + new Blob([key]).size + new Blob([value]).size,
      0,
    );
    expect(summary.available).toBe(true);
    expect(summary.usedBytes).toBe(expected);
    expect(summary.keyCount).toBe(Object.keys(entries).length);
  });

  it("無法列舉鍵名時，仍回報可用但以 null 表示無法估算", () => {
    const summary = getStorageUsageSummary({
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(summary).toEqual({ available: true, usedBytes: null, keyCount: null });
  });

  it("storage 為 null 時視為不可用", () => {
    expect(getStorageUsageSummary(null)).toEqual({ available: false, usedBytes: null, keyCount: null });
  });
});
