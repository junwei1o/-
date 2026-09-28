import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./HomeDashboard.css", import.meta.url), "utf8");

describe("首頁遊戲模式入口", () => {
  it("提供三個真實單機入口（燈塔指航中心已下架），簽到一律走快速行動裡的簽到膠囊", () => {
    expect(source).not.toContain("燈塔指航中心");
    expect(source).not.toContain('setLocation("/tavern")');
    expect(source).toContain("錯題魔王");
    expect(source).toContain("限時挑戰");
    expect(source).toContain("每日簽到");
    expect(source).toContain('setLocation("/community?mode=timed")');
    // 簽到只有一條路徑（dailySignIn.ts）：首頁卡片改為展開「快速行動」側邊欄裡的
    // 簽到膠囊（DailySignInPill），自己再領一次會讓兩份連續天數各自累加。
    // 膠囊不再自動彈出，因此首頁不應殘留任何自動開啟簽到的計時器。
    expect(source).toContain("requestOpenSignInPill()");
    expect(source).toContain("<DailySignInPill");
    expect(source).not.toContain("setShowGoldSignIn");
    expect(source).not.toMatch(/claimDailySignIn\s*\(/);
    expect(source).not.toContain("localStorage.getItem('xueSignIn')");
  });

  it("在窄螢幕以兩欄模式卡保持可讀與可觸控的排列", () => {
    expect(css).toContain(".home-mode-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("混編試卷是模式卡的第四個入口，並導向三軸試卷", () => {
    expect(source).toContain("三軸混編試卷");
    expect(source).toContain('setLocation("/tri-axis-paper")');
    expect(css).toContain(".home-mode-card.is-tri-axis");
    // 卡片順序：錯題魔王 → 限時挑戰 → 每日簽到 → 三軸混編試卷
    const order = ["錯題魔王", "限時挑戰", "每日簽到", "三軸混編試卷"].map((label) => source.indexOf(label));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1], "模式卡順序不符").toBeLessThan(order[i]);
    }
  });
});

describe("首頁版面順序", () => {
  const hud = source.indexOf('className="home-dashboard-hud"');
  const modeHub = source.indexOf('className="home-mode-hub"');
  const status = source.indexOf("TAIWAN EXPEDITION STATUS");
  const journal = source.indexOf("DAILY ADVENTURE LOG");

  it("「選擇下一段學習航線」是 HUD 內最前面的內容區塊（作為主要入口）", () => {
    expect(hud).toBeGreaterThan(-1);
    expect(modeHub).toBeGreaterThan(hud);
    for (const later of [
      'className="home-grade-setup"',
      'className="home-focus-card"',
      'className="home-feature-directory-entry"',
      'className="home-dashboard-status"',
      'slot="footprint"',
    ]) {
      const at = source.indexOf(later);
      expect(at, `找不到 ${later}`).toBeGreaterThan(-1);
      expect(modeHub, `${later} 不應排在「選擇下一段學習航線」之前`).toBeLessThan(at);
    }
  });

  it("「TAIWAN EXPEDITION STATUS」與「DAILY ADVENTURE LOG」排在頁面最底部", () => {
    expect(status).toBeGreaterThan(-1);
    expect(journal).toBeGreaterThan(status);
    for (const earlier of [
      'className="home-mode-hub"',
      'className="home-grade-setup"',
      'className="home-focus-card"',
      'className="home-feature-directory-entry"',
    ]) {
      const at = source.indexOf(earlier);
      expect(at, `找不到 ${earlier}`).toBeGreaterThan(-1);
      expect(at, `${earlier} 應排在 TAIWAN EXPEDITION STATUS 之前`).toBeLessThan(status);
    }
    // 兩者都必須落在快速行動側邊欄之前（側邊欄是浮層，不算頁面內容）
    const sidebar = source.indexOf('className={`home-quick-sidebar');
    expect(sidebar).toBeGreaterThan(-1);
    expect(journal).toBeLessThan(sidebar);
  });
});
