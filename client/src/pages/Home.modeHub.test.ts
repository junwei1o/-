import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./HomeDashboard.css", import.meta.url), "utf8");

describe("首頁遊戲模式入口", () => {
  it("提供四個真實單機入口與統一儲存的每日簽到", () => {
    expect(source).toContain("知識決鬥");
    expect(source).toContain("錯題魔王");
    expect(source).toContain("限時挑戰");
    expect(source).toContain("每日簽到");
    expect(source).toContain('setLocation("/duel")');
    expect(source).toContain('setLocation("/community?mode=timed")');
    expect(source).toContain("claimDailySignIn()");
    expect(source).not.toContain("localStorage.getItem('xueSignIn')");
  });

  it("在窄螢幕以兩欄模式卡保持可讀與可觸控的排列", () => {
    expect(css).toContain(".home-mode-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
