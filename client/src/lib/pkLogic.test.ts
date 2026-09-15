import { describe, expect, it } from "vitest";
import { computePkScore, decidePkOutcome, generatePkCode, normalizePkCode } from "./pkLogic";

describe("異步 PK 邏輯", () => {
  it("邀請碼為 6 碼且不含易混淆字元 0/O/1/I", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generatePkCode();
      expect(code).toHaveLength(6);
      expect(/^[A-HJ-NP-Z2-9]{6}$/.test(code)).toBe(true);
    }
  });

  it("計分：全對 100、一半 50、全錯 0", () => {
    expect(computePkScore(10, 10)).toBe(100);
    expect(computePkScore(5, 10)).toBe(50);
    expect(computePkScore(0, 10)).toBe(0);
    expect(computePkScore(7, 10)).toBe(70);
  });

  it("total 為 0 時安全回傳 0", () => {
    expect(computePkScore(0, 0)).toBe(0);
  });

  it("勝負判定：發起者視角", () => {
    expect(decidePkOutcome("小明", "小明", 80, 60)).toBe("win");
    expect(decidePkOutcome("小華", "小明", 80, 60)).toBe("lose");
    expect(decidePkOutcome("小明", "小明", 70, 70)).toBe("draw");
  });

  it("邀請碼規範化：去空白轉大寫", () => {
    expect(normalizePkCode("  k7p2qx ")).toBe("K7P2QX");
  });
});
