import { beforeEach, describe, expect, it } from "vitest";
import { clearAuditForTest, listAudit, recordAudit, MAX_AUDIT_ENTRIES_FOR_TEST } from "./auditLog";

/**
 * 維運操作審計的測試。
 *
 * 這個模組很小，但它是「出事後唯一能回答『誰做的』」的地方，
 * 所以邊界行為要鎖死：環形上限、由新到旧、以及**記錄失敗不影響主流程**。
 */

describe("recordAudit / listAudit", () => {
  beforeEach(() => {
    clearAuditForTest();
  });

  it("記錄一筆操作並能讀回", () => {
    recordAudit("healthCheck", true, "三項檢查全數正常");
    const { entries, total } = listAudit();
    expect(total).toBe(1);
    expect(entries[0]).toMatchObject({ action: "healthCheck", ok: true, detail: "三項檢查全數正常" });
  });

  it("⭐ 由新到舊排序（站長看最近的，不是最舊的）", () => {
    recordAudit("first", true, "1");
    recordAudit("second", true, "2");
    recordAudit("third", true, "3");
    const { entries } = listAudit();
    expect(entries.map((entry) => entry.action)).toEqual(["third", "second", "first"]);
  });

  it("⭐ 環形上限：超過容量時丟掉最舊的，不會無限成長", () => {
    const overflow = MAX_AUDIT_ENTRIES_FOR_TEST + 25;
    for (let i = 0; i < overflow; i += 1) recordAudit(`op-${i}`, true, `第 ${i} 次`);

    const { entries, total, capacity } = listAudit(MAX_AUDIT_ENTRIES_FOR_TEST);
    expect(total).toBe(MAX_AUDIT_ENTRIES_FOR_TEST);
    expect(capacity).toBe(MAX_AUDIT_ENTRIES_FOR_TEST);
    // 最新一筆一定還在
    expect(entries[0].action).toBe(`op-${overflow - 1}`);
    // 最舊的兩筆已被丟棄
    expect(entries.some((entry) => entry.action === "op-0")).toBe(false);
  });

  it("detail 會被截斷——審計紀錄不該變成塞東西的地方", () => {
    recordAudit("op", true, "x".repeat(500));
    const { entries } = listAudit();
    expect(entries[0].detail.length).toBeLessThanOrEqual(160);
  });

  it("預設 actor 是站長（後台只有一種身分）", () => {
    recordAudit("op", true, "x");
    expect(listAudit().entries[0].actor).toBe("站長");
  });

  it("limit 會被夾在合法範圍內", () => {
    for (let i = 0; i < 5; i += 1) recordAudit(`op-${i}`, true, "x");
    expect(listAudit(0).entries.length).toBeGreaterThan(0);
    expect(listAudit(9999).entries.length).toBeLessThanOrEqual(MAX_AUDIT_ENTRIES_FOR_TEST);
  });
});
