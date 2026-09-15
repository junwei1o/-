// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

vi.mock("@/game/cloudSync", () => ({
  cloudApi: {
    register: vi.fn().mockResolvedValue({ ok: false, reason: "taken" }),
    save: vi.fn().mockResolvedValue({ ok: true }),
    load: vi.fn().mockResolvedValue({ ok: false, reason: "notFound" }),
  },
  decideMerge: vi.fn(() => "remote"),
  extractMetrics: vi.fn(() => ({ coins: 0, totalAnswers: 0, badges: 0 })),
  getCloudMode: vi.fn(() => ({ mode: "local" })),
}));

vi.mock("@/game/mainlineFeatures", () => ({
  hashParentPin: vi.fn((pin: string) => {
    let hash = 2166136261;
    for (const char of pin) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }),
  isValidParentPin: vi.fn((pin: string) => /^\d{4}$/.test(pin)),
}));

import { pinCloudName, saveProgressWithPin, loadProgressWithPin } from "./pinCloudSync";
import { hashParentPin } from "@/game/mainlineFeatures";

describe("pinCloudSync", () => {
  it("相同 PIN 產生相同且符合規則的船籍名", () => {
    const name = pinCloudName("1234");
    expect(name).toBe(`p${hashParentPin("1234").slice(0, 5)}`);
    expect(name.length).toBeGreaterThanOrEqual(2);
    expect(name.length).toBeLessThanOrEqual(6);
    expect(/^[A-Za-z0-9]+$/.test(name)).toBe(true);
    expect(pinCloudName("1234")).toBe(pinCloudName("1234"));
  });

  it("不同 PIN 產生不同船籍名", () => {
    expect(pinCloudName("1234")).not.toBe(pinCloudName("5678"));
  });

  it("非 4 位數字 PIN 直接回 invalidPin", async () => {
    expect(await saveProgressWithPin("12ab")).toMatchObject({ ok: false, reason: "invalidPin" });
    expect(await loadProgressWithPin("123")).toMatchObject({ ok: false, reason: "invalidPin" });
  });

  it("儲存時 register taken 視為已存在並繼續 save（結果 ok）", async () => {
    const result = await saveProgressWithPin("1234");
    expect(result.ok).toBe(true);
  });

  it("雲端無資料時載入回 notFound", async () => {
    const result = await loadProgressWithPin("1234");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("notFound");
  });
});
