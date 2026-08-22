import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./HomeDashboard.css", import.meta.url), "utf8");

describe("首頁行動版地圖版面", () => {
  it("將東部節點保持在首頁窄畫布的安全可視範圍內", () => {
    expect(css).toContain(".home-dashboard-map-layer .taiwan-map-island.island-science");
    expect(css).toContain("left: 69% !important;");
  });
});
