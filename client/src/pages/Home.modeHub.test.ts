import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./HomeDashboard.css", import.meta.url), "utf8");

describe("首頁遊戲模式入口", () => {
  it("提供四個真實單機入口，簽到一律走統一的彈窗", () => {
    expect(source).toContain("燈塔酒館");
    expect(source).toContain("錯題魔王");
    expect(source).toContain("限時挑戰");
    expect(source).toContain("每日簽到");
    expect(source).toContain('setLocation("/tavern")');
    expect(source).toContain('setLocation("/community?mode=timed")');
    // 簽到只有一條路徑：首頁卡片開啟統一彈窗（dailySignIn.ts），
    // 自己再領一次會讓兩份連續天數各自累加。
    expect(source).toContain("setShowGoldSignIn(true)");
    expect(source).not.toMatch(/claimDailySignIn\s*\(/);
    expect(source).not.toContain("localStorage.getItem('xueSignIn')");
  });

  it("在窄螢幕以兩欄模式卡保持可讀與可觸控的排列", () => {
    expect(css).toContain(".home-mode-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
