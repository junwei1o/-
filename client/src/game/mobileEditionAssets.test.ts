import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../pages/HomeDashboard.css", import.meta.url), "utf8");

describe("首頁行動版沉浸式儀表板", () => {
  it("將台灣主航海圖保留為非重複的背景層，並以實際可操作的快捷行動取代舊任務停靠列", () => {
    expect(home).toContain("TaiwanMainNavigationMap");
    expect(home).toContain('className="home-dashboard-map-layer"');
    expect(home).toContain("開始探險");
    expect(home).toContain("隨機冒險");
  });

  it("保留行動優先的毛玻璃層、夕陽橘主要行動與降低動態效果保護", () => {
    expect(css).toMatch(/backdrop-filter:\s*blur\(12px\)/);
    expect(css).toMatch(/#ff6b35/i);
    expect(css).toMatch(/@media\s*\(max-width:\s*\d+px\)/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
