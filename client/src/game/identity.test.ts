// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { getPlayerName, isGuest } from "./identity";

const CLOUD_MODE_KEY = "xue-cloud-mode-v1";
const GUEST_NAME_KEY = "xue-guest-name-v1";

beforeEach(() => {
  localStorage.clear();
});

describe("遊客身分", () => {
  it("沒有雲端船籍時自動產生「遊客＋4 位數字」", () => {
    const name = getPlayerName();
    expect(name.startsWith("遊客")).toBe(true);
    expect(name).toHaveLength(6);
    const digits = name.slice(2);
    expect(digits).toMatch(/^\d{4}$/);
    expect(Number(digits)).toBeGreaterThanOrEqual(1000);
    expect(Number(digits)).toBeLessThanOrEqual(9999);
    expect(isGuest()).toBe(true);
  });

  it("遊客名字在同一瀏覽器保持穩定，不會每次重生成", () => {
    const first = getPlayerName();
    const second = getPlayerName();
    expect(second).toBe(first);
    expect(localStorage.getItem(GUEST_NAME_KEY)).toBe(first);
  });
});

describe("雲端船籍身分", () => {
  it("已取船名時使用雲端名字，且不視為遊客", () => {
    localStorage.setItem(CLOUD_MODE_KEY, JSON.stringify({ mode: "cloud", name: "小航海士", linkedAt: 123 }));
    expect(getPlayerName()).toBe("小航海士");
    expect(isGuest()).toBe(false);
  });

  it("雲端模式資料毀損時退回遊客身分", () => {
    localStorage.setItem(CLOUD_MODE_KEY, "not-json");
    const name = getPlayerName();
    expect(name.startsWith("遊客")).toBe(true);
    expect(isGuest()).toBe(true);
  });
});
